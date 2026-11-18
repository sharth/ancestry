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
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type UrlRepositorySuggestion,
} from "./source-validators";

/** Every URL suggestion for one source, applied together as one edit. */
export interface SourceUrlSuggestions {
  source: GedcomSource;
  suggestions: UrlRepositorySuggestion[];
}

/** Lists the sources that don't cite any repository (no REPO link), so
 * there's no record of where the original can be found, along with the
 * repositories suggested for each from URLs found in its text. */
@Component({
  selector: "app-sources-without-repositories",
  imports: [RouterModule, GedcomDiffComponent, GedcomEditorDialogComponent],
  templateUrl: "./sources-without-repositories.component.html",
})
export class SourcesWithoutRepositoriesComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  // The source whose suggestions are open in the editor dialog, if any.
  readonly reviewing = signal<SourceUrlSuggestions | undefined>(undefined);

  // The editor dialog opens with the suggested fix already applied, so it
  // can be reviewed and edited further before saving.
  readonly reviewSuggestion = computed(() => {
    const reviewing = this.reviewing();
    if (reviewing === undefined) return undefined;
    return applyUrlSuggestions(
      this.ancestryDatabase(),
      reviewing.source,
      reviewing.suggestions,
    );
  });

  readonly reviewDatabase = computed(
    () => this.reviewSuggestion()?.database ?? this.ancestryDatabase(),
  );

  // The source first, then each repository the suggestions create, so both
  // can be reviewed without going to find the new repository.
  readonly reviewTabs = computed<TabInformation[]>(() => {
    const reviewing = this.reviewing();
    if (reviewing === undefined) return [];
    return [
      { type: "SOUR", xref: reviewing.source.xref },
      ...(this.reviewSuggestion()?.createdRepositoryXrefs ?? []).map(
        (xref): TabInformation => ({ type: "REPO", xref }),
      ),
    ];
  });

  readonly sourcesWithoutRepositories = computed(() =>
    findSourcesWithoutRepositories(this.ancestryDatabase()).map((source) => {
      const suggestions = sourceValidators(
        source,
        this.ancestryDatabase(),
      ).warnings.flatMap((warning) => warning.urlSuggestion ?? []);
      return {
        source,
        suggestions,
        differences:
          suggestions.length > 0 ? this.differences(source, suggestions) : [],
      };
    }),
  );

  // The records that would actually change on disk if `suggestions` are
  // applied and saved, built from the same diff the save path uses.
  private differences(
    source: GedcomSource,
    suggestions: UrlRepositorySuggestion[],
  ) {
    const { database } = applyUrlSuggestions(
      this.ancestryDatabase(),
      source,
      suggestions,
    );
    return this.ancestryService.gedcomDatabaseDifferences(database);
  }

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  async review(suggestions: SourceUrlSuggestions) {
    this.reviewing.set(suggestions);
    await this.editDialog().showModal();
  }

  // Applies the suggested fix directly and saves it, without opening the
  // editor dialog.
  async submit({ source, suggestions }: SourceUrlSuggestions) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const { database } = applyUrlSuggestions(
      this.ancestryDatabase(),
      source,
      suggestions,
    );
    await this.ancestryService.updateGedcomDatabase(database);
  }
}

export function findSourcesWithoutRepositories(gedcomDatabase: GedcomDatabase) {
  return Object.values(gedcomDatabase.sources).filter(
    (source) => source.repositoryLinks.length === 0,
  );
}
