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
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyBibliographyTitleSuggestion,
  bibliographyForMissingTitle,
} from "./apply-bibliography-title-suggestion.util";
import { applyFamilySearchIdSuggestion } from "./apply-familysearch-id-suggestion.util";
import { applyMergeRepositoryLinksSuggestion } from "./apply-merge-repository-links-suggestion.util";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import { BibliographyWithoutTitleComponent } from "./bibliography-without-title.component";
import {
  DuplicateCallNumbersComponent,
  findDuplicateCallNumbers,
} from "./duplicate-call-numbers.component";
import {
  FamilySearchIdsComponent,
  findFamilySearchIdsToConvert,
} from "./familysearch-ids.component";
import {
  sourceValidators,
  type MergeRepositoryLinksSuggestion,
  type UrlRepositorySuggestion,
} from "./source-validators";
import {
  findSourcesWithoutRepositories,
  SourcesWithoutRepositoriesComponent,
} from "./sources-without-repositories.component";
import {
  findUnusedMultimedia,
  UnusedMultimediaComponent,
} from "./unused-multimedia.component";
import {
  findUnusedSources,
  UnusedSourcesComponent,
} from "./unused-sources.component";

/** Which suggestion is currently under review in the GEDCOM editor dialog,
 * and the source it applies to -- a source can have more than one
 * suggestion, so the source's xref alone isn't enough to identify which
 * one is being fixed. */
type ReviewState =
  | {
      kind: "url";
      source: GedcomSource;
      suggestions: UrlRepositorySuggestion[];
    }
  | {
      kind: "merge";
      source: GedcomSource;
      suggestion: MergeRepositoryLinksSuggestion;
    }
  | {
      kind: "bibliography";
      source: GedcomSource;
    }
  | {
      kind: "familysearch-id";
      individual: GedcomIndividual;
    };

const tabs = [
  { id: "source-warnings", label: "Source warnings" },
  { id: "sources-without-repositories", label: "Sources without repositories" },
  { id: "duplicate-call-numbers", label: "Duplicate call numbers" },
  { id: "unused-sources", label: "Unused sources" },
  { id: "unused-multimedia", label: "Unused multimedia" },
  { id: "bibliography-without-title", label: "Bibliography without title" },
  { id: "familysearch-ids", label: "FamilySearch ids" },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface TableRow {
  source: GedcomSource;
  severity: "Error" | "Warning";
  fieldName: string;
  groupName: string;
  message: string;
  urlSuggestion?: UrlRepositorySuggestion;
  mergeSuggestion?: MergeRepositoryLinksSuggestion;
}

@Component({
  selector: "app-validation",
  imports: [
    RouterModule,
    GedcomEditorDialogComponent,
    GedcomDiffComponent,
    DuplicateCallNumbersComponent,
    UnusedMultimediaComponent,
    UnusedSourcesComponent,
    SourcesWithoutRepositoriesComponent,
    BibliographyWithoutTitleComponent,
    FamilySearchIdsComponent,
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

  // Each validation check is shown in its own tab. The tabs aren't routed
  // like the individual and source pages' tabs, because the source warnings
  // and sources without repositories checks hand their suggested fixes back
  // to this page's editor dialog through outputs, which a routed child
  // can't bind.
  readonly tabs = tabs;
  readonly activeTab = signal<TabId>("source-warnings");

  // How many findings each tab lists, shown on the tab itself -- computed
  // here, not by the tab's own component, since only the active tab's
  // component is rendered.
  readonly tabCounts = computed<Record<TabId, number>>(() => {
    const database = this.ancestryDatabase();
    return {
      "source-warnings": this.rows().length,
      "sources-without-repositories":
        findSourcesWithoutRepositories(database).length,
      "duplicate-call-numbers": findDuplicateCallNumbers(database).length,
      "unused-sources": findUnusedSources(database).length,
      "unused-multimedia": findUnusedMultimedia(database).length,
      "bibliography-without-title": Object.values(database.sources).filter(
        (source) => bibliographyForMissingTitle(source) !== undefined,
      ).length,
      "familysearch-ids": findFamilySearchIdsToConvert(database).length,
    };
  });

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly sourceScenarios = computed(() =>
    Object.values(this.ancestryDatabase().sources).map((source) => ({
      source,
      result: sourceValidators(source, this.ancestryDatabase()),
    })),
  );

  // Errors and warnings across every source, flattened into a single list
  // in display order -- rendered by one `@for` in the template (rather
  // than nested per-source loops) so each row's position in the list is
  // known, which is what lets a warning's button row stay `position:
  // sticky` scoped to just its own diff (see validation.component.css):
  // each row with a diff wraps itself and the diff that follows it in
  // their own containing box, which only works cleanly with a flat list
  // of rows to walk through, not a table nested two loops deep.
  readonly rows = computed<TableRow[]>(() => {
    const result: TableRow[] = [];
    for (const sourceScenario of this.sourceScenarios()) {
      for (const error of sourceScenario.result.errors) {
        result.push({
          source: sourceScenario.source,
          severity: "Error",
          fieldName: error.fieldName,
          groupName: error.groupName,
          message: error.message,
        });
      }
      for (const warning of sourceScenario.result.warnings) {
        // A source with no repository at all shows its URL suggestions in
        // the "Sources without repositories" section instead.
        if (
          warning.urlSuggestion !== undefined &&
          sourceScenario.source.repositoryLinks.length === 0
        ) {
          continue;
        }
        result.push({
          source: sourceScenario.source,
          severity: "Warning",
          fieldName: warning.fieldName,
          groupName: warning.groupName,
          message: warning.message,
          urlSuggestion: warning.urlSuggestion,
          mergeSuggestion: warning.mergeRepositoryLinksSuggestion,
        });
      }
    }
    return result;
  });

  // Each row's preview of its suggested fix (empty when it has none), by
  // row index. Computed once per database here, separately from `rows` so
  // the tab count doesn't build every preview, rather than from the
  // template, which would rebuild every preview on every change detection
  // (e.g. each keystroke in the editor dialog).
  readonly rowDifferences = computed(() =>
    this.rows().map((row) =>
      row.urlSuggestion !== undefined
        ? this.differencesForUrlSuggestions(row.source, [row.urlSuggestion])
        : row.mergeSuggestion !== undefined
          ? this.differencesForMergeSuggestion(row.source, row.mergeSuggestion)
          : [],
    ),
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
    if (state.kind === "familysearch-id") {
      return applyFamilySearchIdSuggestion(this.ancestryDatabase(), [
        state.individual.xref,
      ]);
    }
    if (state.kind === "bibliography") {
      return applyBibliographyTitleSuggestion(
        this.ancestryDatabase(),
        state.source,
      ).database;
    }
    if (state.kind === "merge") {
      return applyMergeRepositoryLinksSuggestion(
        this.ancestryDatabase(),
        state.source,
        state.suggestion,
      );
    }
    return applyUrlSuggestions(
      this.ancestryDatabase(),
      state.source,
      state.suggestions,
    ).database;
  });

  // The tabs to hand the editor dialog: the source being reviewed first
  // (so it's the one shown by default), plus -- when the suggestions create
  // new repositories rather than linking to existing ones -- each new
  // repository's own tab, so the user sees both without having to go find
  // the new repository themselves.
  readonly reviewTabs = computed<TabInformation[]>(() => {
    const state = this.reviewState();
    if (state === undefined) return [];
    if (state.kind === "familysearch-id") {
      return [{ type: "INDI", xref: state.individual.xref }];
    }
    const tabs: TabInformation[] = [{ type: "SOUR", xref: state.source.xref }];
    if (state.kind === "url") {
      const { createdRepositoryXrefs } = applyUrlSuggestions(
        this.ancestryDatabase(),
        state.source,
        state.suggestions,
      );
      for (const xref of createdRepositoryXrefs) {
        tabs.push({ type: "REPO", xref });
      }
    }
    if (state.kind === "bibliography") {
      const { createdRepositoryXrefs } = applyBibliographyTitleSuggestion(
        this.ancestryDatabase(),
        state.source,
      );
      for (const xref of createdRepositoryXrefs) {
        tabs.push({ type: "REPO", xref });
      }
    }
    return tabs;
  });

  reviewUrlSuggestions(
    source: GedcomSource,
    suggestions: UrlRepositorySuggestion[],
  ) {
    this.reviewState.set({ kind: "url", source, suggestions });
  }

  reviewMergeSuggestion(
    source: GedcomSource,
    suggestion: MergeRepositoryLinksSuggestion,
  ) {
    this.reviewState.set({ kind: "merge", source, suggestion });
  }

  reviewBibliographySuggestion(source: GedcomSource) {
    this.reviewState.set({ kind: "bibliography", source });
  }

  // Applies a suggested fix directly and saves it, without opening the
  // editor dialog for further review.
  async submitUrlSuggestions(
    source: GedcomSource,
    suggestions: UrlRepositorySuggestion[],
  ) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const { database } = applyUrlSuggestions(
      this.ancestryDatabase(),
      source,
      suggestions,
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

  async submitBibliographySuggestion(source: GedcomSource) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const { database } = applyBibliographyTitleSuggestion(
      this.ancestryDatabase(),
      source,
    );
    await this.ancestryService.updateGedcomDatabase(database);
    await this.reload();
  }

  reviewFamilySearchIdSuggestion(individual: GedcomIndividual) {
    this.reviewState.set({ kind: "familysearch-id", individual });
  }

  async submitFamilySearchIdSuggestions(individuals: GedcomIndividual[]) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const database = applyFamilySearchIdSuggestion(
      this.ancestryDatabase(),
      individuals.map((individual) => individual.xref),
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

  // The records that would actually change on disk if `suggestions` are
  // applied and saved -- built from AncestryService.compareGedcomDatabase(),
  // the exact same diff serializeGedcomDatabase() writes from, so this
  // preview shows everything that would change (CHAN and HEAD included),
  // not just the source being fixed. Computed fresh each time rather than
  // reusing `reviewDatabase` so it stays correct even when nothing has been
  // selected for review yet.
  differencesForUrlSuggestions(
    source: GedcomSource,
    suggestions: UrlRepositorySuggestion[],
  ): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    const { database } = applyUrlSuggestions(
      this.ancestryDatabase(),
      source,
      suggestions,
    );
    return this.actualDifferences(database);
  }

  differencesForMergeSuggestion(
    source: GedcomSource,
    suggestion: MergeRepositoryLinksSuggestion,
  ): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    const database = applyMergeRepositoryLinksSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    return this.actualDifferences(database);
  }

  private actualDifferences(database: GedcomDatabase): {
    originalGedcomRecord?: GedcomRecord;
    updatedGedcomRecord?: GedcomRecord;
  }[] {
    return this.ancestryService.gedcomDatabaseDifferences(database);
  }
}
