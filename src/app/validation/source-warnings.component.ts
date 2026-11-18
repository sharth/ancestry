import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";

import {
  AncestryService,
  type GedcomResourceValue,
} from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { applyMergeRepositoryLinksSuggestion } from "./apply-merge-repository-links-suggestion.util";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
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
  | {
      kind: "url";
      source: GedcomSource;
      suggestions: UrlRepositorySuggestion[];
    }
  | {
      kind: "merge";
      source: GedcomSource;
      suggestion: MergeRepositoryLinksSuggestion;
    };

export interface TableRow {
  source: GedcomSource;
  severity: "Error" | "Warning";
  fieldName: string;
  groupName: string;
  message: string;
  urlSuggestion?: UrlRepositorySuggestion;
  mergeSuggestion?: MergeRepositoryLinksSuggestion;
}

/** Errors and warnings across every source, flattened into a single list
 * in display order -- rendered by one `@for` in the template (rather than
 * nested per-source loops) so each row's position in the list is known,
 * which is what lets a warning's button row stay `position: sticky` scoped
 * to just its own diff (see source-warnings.component.css): each row with
 * a diff wraps itself and the diff that follows it in their own containing
 * box, which only works cleanly with a flat list of rows to walk through,
 * not a table nested two loops deep. */
export function findSourceWarnings(database: GedcomDatabase): TableRow[] {
  const result: TableRow[] = [];
  for (const source of Object.values(database.sources)) {
    const { errors, warnings } = sourceValidators(source, database);
    for (const error of errors) {
      result.push({
        source,
        severity: "Error",
        fieldName: error.fieldName,
        groupName: error.groupName,
        message: error.message,
      });
    }
    for (const warning of warnings) {
      // A source with no repository at all shows its URL suggestions in
      // the "Sources without repositories" section instead.
      if (
        warning.urlSuggestion !== undefined &&
        source.repositoryLinks.length === 0
      ) {
        continue;
      }
      result.push({
        source,
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
}

/** Lists every source's errors and warnings, with a suggested fix for the
 * warnings that have one. */
@Component({
  selector: "app-source-warnings",
  imports: [RouterModule, GedcomDiffComponent, GedcomEditorDialogComponent],
  templateUrl: "./source-warnings.component.html",
  styleUrl: "./source-warnings.component.css",
})
export class SourceWarningsComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  readonly rows = computed(() => findSourceWarnings(this.ancestryDatabase()));

  // Each row's preview of its suggested fix (empty when it has none), by
  // row index. Computed once per database here rather than from the
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
