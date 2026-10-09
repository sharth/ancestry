import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
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
import { applyMergeRepositoryLinksSuggestion } from "./apply-merge-repository-links-suggestion.util";
import { applyUrlSuggestion } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type MergeRepositoryLinksSuggestion,
  type UrlRepositorySuggestion,
} from "./source-validators";

/** Which suggestion is currently under review in the GEDCOM editor dialog,
 * and the source it applies to -- a source can have more than one
 * suggestion, so the source's xref alone isn't enough to identify which
 * one is being fixed. */
type ReviewState =
  | { kind: "url"; source: GedcomSource; suggestion: UrlRepositorySuggestion }
  | {
      kind: "merge";
      source: GedcomSource;
      suggestion: MergeRepositoryLinksSuggestion;
    };

@Component({
  selector: "app-validation",
  imports: [RouterModule, GedcomEditorDialogComponent, GedcomDiffComponent],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
})
export class ValidationComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly sourceScenarios = computed(() =>
    Object.values(this.ancestryDatabase().sources).map((source) => ({
      source,
      result: sourceValidators(source, this.ancestryDatabase()),
    })),
  );

  // The suggestion currently being reviewed in the GEDCOM editor dialog, if
  // any.
  readonly reviewState = signal<ReviewState | undefined>(undefined);

  // The database to hand the editor dialog: the suggested fix for
  // `reviewState`'s source pre-applied, so the dialog opens already
  // showing it -- the user can then review it (alongside the editor's own
  // before/after diff) and keep editing before saving, or cancel.
  readonly reviewDatabase = computed<GedcomDatabase>(() => {
    const state = this.reviewState();
    if (state === undefined) return this.ancestryDatabase();
    if (state.kind === "merge") {
      return applyMergeRepositoryLinksSuggestion(
        this.ancestryDatabase(),
        state.source,
        state.suggestion,
      );
    }
    return applyUrlSuggestion(
      this.ancestryDatabase(),
      state.source,
      state.suggestion,
    ).database;
  });

  // The tabs to hand the editor dialog: the source being reviewed first
  // (so it's the one shown by default), plus -- when the suggestion creates
  // a new repository rather than linking to an existing one -- that
  // repository's own tab, so the user sees both without having to go find
  // the new repository themselves.
  readonly reviewTabs = computed<TabInformation[]>(() => {
    const state = this.reviewState();
    if (state === undefined) return [];
    const tabs: TabInformation[] = [{ type: "SOUR", xref: state.source.xref }];
    if (
      state.kind === "url" &&
      state.suggestion.matchedRepository === undefined
    ) {
      const { repositoryXref } = applyUrlSuggestion(
        this.ancestryDatabase(),
        state.source,
        state.suggestion,
      );
      tabs.push({ type: "REPO", xref: repositoryXref });
    }
    return tabs;
  });

  reviewUrlSuggestion(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ) {
    this.reviewState.set({ kind: "url", source, suggestion });
  }

  reviewMergeSuggestion(
    source: GedcomSource,
    suggestion: MergeRepositoryLinksSuggestion,
  ) {
    this.reviewState.set({ kind: "merge", source, suggestion });
  }

  // Applies a suggested fix directly and saves it, without opening the
  // editor dialog for further review.
  async submitUrlSuggestion(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const { database } = applyUrlSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    await this.ancestryService.updateGedcomDatabase(database);
    await this.reload();
  }

  async submitMergeSuggestion(
    source: GedcomSource,
    suggestion: MergeRepositoryLinksSuggestion,
  ) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const database = applyMergeRepositoryLinksSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    await this.ancestryService.updateGedcomDatabase(database);
    await this.reload();
  }

  private async reload() {
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
  afterSourceRecordForUrlSuggestion(
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

  afterSourceRecordForMergeSuggestion(
    source: GedcomSource,
    suggestion: MergeRepositoryLinksSuggestion,
  ): GedcomRecord | undefined {
    const database = applyMergeRepositoryLinksSuggestion(
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
