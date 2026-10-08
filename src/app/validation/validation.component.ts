import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import {
  serializeGedcomSource,
  type GedcomSource,
} from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { applyUrlSuggestion } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type SourceValidationResult,
  type UrlRepositorySuggestion,
  type ValidationFinding,
} from "./source-validators";

interface DiffWarning {
  sourceScenario: { source: GedcomSource; result: SourceValidationResult };
  warning: ValidationFinding;
  urlSuggestion: UrlRepositorySuggestion;
}

@Component({
  selector: "app-validation",
  imports: [
    RouterModule,
    NgTemplateOutlet,
    GedcomEditorDialogComponent,
    GedcomDiffComponent,
  ],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
})
export class ValidationComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  // One zero-area-but-for-1px marker row per warning that has a diff,
  // placed right after that warning's button row -- in the same order as
  // `diffWarnings` below, since both iterate `sourceScenarios()` the same
  // way. An IntersectionObserver on these (see the constructor) tells us
  // which warning's diff the user has scrolled into, so the floating
  // `.sticky-toolbar` in the template can stand in for its button row.
  private readonly sentinels = viewChildren<unknown, ElementRef<HTMLElement>>(
    "sentinel",
    { read: ElementRef },
  );
  private readonly endSentinel = viewChild<unknown, ElementRef<HTMLElement>>(
    "endSentinel",
    { read: ElementRef },
  );

  // The index into `diffWarnings()` of the warning currently being
  // scrolled through, or undefined when none is (above the first one, or
  // past the last one's diff).
  private readonly activeIndex = signal<number | undefined>(undefined);

  readonly diffWarnings = computed<DiffWarning[]>(() => {
    const entries: DiffWarning[] = [];
    for (const sourceScenario of this.sourceScenarios()) {
      for (const warning of sourceScenario.result.warnings) {
        if (warning.urlSuggestion !== undefined) {
          entries.push({
            sourceScenario,
            warning,
            urlSuggestion: warning.urlSuggestion,
          });
        }
      }
    }
    return entries;
  });

  readonly activeDiffWarning = computed<DiffWarning | undefined>(
    () => this.diffWarnings()[this.activeIndex() ?? -1],
  );

  constructor() {
    effect((onCleanup) => {
      const sentinelElements = this.sentinels().map((ref) => ref.nativeElement);
      const endSentinelElement = this.endSentinel()?.nativeElement;
      if (sentinelElements.length === 0 || endSentinelElement === undefined) {
        this.activeIndex.set(undefined);
        return;
      }

      // Position relative to the scroll container's own top edge, not the
      // viewport's -- `main` (the app's scrollable content area) doesn't
      // start at the top of the page.
      const relativeTops = new Map<Element, number>();

      const recompute = () => {
        let active: number | undefined;
        for (const [index, element] of sentinelElements.entries()) {
          const top = relativeTops.get(element);
          if (top !== undefined && top <= 0) active = index;
        }
        const endTop = relativeTops.get(endSentinelElement);
        if (endTop !== undefined && endTop <= 0) active = undefined;
        this.activeIndex.set(active);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const rootTop = entry.rootBounds?.top ?? 0;
            relativeTops.set(
              entry.target,
              entry.boundingClientRect.top - rootTop,
            );
          }
          recompute();
        },
        { root: sentinelElements[0]?.closest("main") ?? null, threshold: 0 },
      );

      for (const element of sentinelElements) observer.observe(element);
      observer.observe(endSentinelElement);

      onCleanup(() => {
        observer.disconnect();
      });
    });
  }

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly sourceScenarios = computed(() =>
    Object.values(this.ancestryDatabase().sources).map((source) => ({
      source,
      result: sourceValidators(source, this.ancestryDatabase()),
    })),
  );

  // The source currently being reviewed in the GEDCOM editor dialog, if any.
  readonly reviewXref = signal<string | undefined>(undefined);

  // The database to hand the editor dialog: the suggested fix for
  // `reviewXref`'s source pre-applied, so the dialog opens already showing
  // it -- the user can then review it (alongside the editor's own
  // before/after diff) and keep editing before saving, or cancel.
  readonly reviewDatabase = computed<GedcomDatabase>(() => {
    const suggestion = this.reviewSuggestion();
    if (suggestion === undefined) return this.ancestryDatabase();
    return applyUrlSuggestion(
      this.ancestryDatabase(),
      suggestion.source,
      suggestion.urlSuggestion,
    ).database;
  });

  // The tabs to hand the editor dialog: the source being reviewed first
  // (so it's the one shown by default), plus -- when the suggestion creates
  // a new repository rather than linking to an existing one -- that
  // repository's own tab, so the user sees both without having to go find
  // the new repository themselves.
  readonly reviewTabs = computed<TabInformation[]>(() => {
    const suggestion = this.reviewSuggestion();
    if (suggestion === undefined) return [];
    const tabs: TabInformation[] = [
      { type: "SOUR", xref: suggestion.source.xref },
    ];
    if (suggestion.urlSuggestion.matchedRepository === undefined) {
      const { repositoryXref } = applyUrlSuggestion(
        this.ancestryDatabase(),
        suggestion.source,
        suggestion.urlSuggestion,
      );
      tabs.push({ type: "REPO", xref: repositoryXref });
    }
    return tabs;
  });

  private readonly reviewSuggestion = computed(() =>
    this.findSuggestion(this.reviewXref()),
  );

  private findSuggestion(xref: string | undefined) {
    if (xref === undefined) return undefined;
    for (const sourceScenario of this.sourceScenarios()) {
      if (sourceScenario.source.xref !== xref) continue;
      for (const warning of sourceScenario.result.warnings) {
        if (warning.urlSuggestion !== undefined) {
          return {
            source: sourceScenario.source,
            urlSuggestion: warning.urlSuggestion,
          };
        }
      }
    }
    return undefined;
  }

  review(xref: string) {
    this.reviewXref.set(xref);
  }

  // Applies the suggested fix directly and saves it, without opening the
  // editor dialog for further review.
  async submitProposed(xref: string) {
    const suggestion = this.findSuggestion(xref);
    if (suggestion === undefined) return;

    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const { database } = applyUrlSuggestion(
      this.ancestryDatabase(),
      suggestion.source,
      suggestion.urlSuggestion,
    );
    await this.ancestryService.updateGedcomDatabase(database);
    await this.router.navigate([], {
      relativeTo: this.route,
      onSameUrlNavigation: "reload",
      skipLocationChange: true,
    });
  }

  beforeSourceRecord(source: GedcomSource): GedcomRecord {
    return serializeGedcomSource(source);
  }

  // The source as it'd look after `suggestion` is applied -- a preview
  // only, computed fresh each time rather than reusing `reviewDatabase` so
  // it stays correct even when nothing has been selected for review yet.
  afterSourceRecord(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ): GedcomRecord | undefined {
    const { database } = applyUrlSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    const updatedSource = database.sources[source.xref];
    if (updatedSource === undefined) return undefined;
    return serializeGedcomSource(updatedSource);
  }

  // The repository a suggestion would create, when it doesn't match an
  // existing one -- undefined when the suggestion links to an existing
  // repository instead, since that repository is left unchanged.
  afterRepositoryRecord(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ): GedcomRecord | undefined {
    if (suggestion.matchedRepository !== undefined) return undefined;
    const { database, repositoryXref } = applyUrlSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    const newRepository = database.repositories[repositoryXref];
    if (newRepository === undefined) return undefined;
    return serializeGedcomRepository(newRepository);
  }
}
