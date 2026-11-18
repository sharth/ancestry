import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { applyMergeRepositoryLinksSuggestion } from "./apply-merge-repository-links-suggestion.util";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type MergeRepositoryLinksSuggestion,
  type UrlRepositorySuggestion,
} from "./source-validators";
import {
  ValidationTableComponent,
  type ValidationRow,
} from "./validation-table.component";

export interface SourceWarning {
  source: GedcomSource;
  severity: "Error" | "Warning";
  message: string;
  urlSuggestion?: UrlRepositorySuggestion;
  mergeSuggestion?: MergeRepositoryLinksSuggestion;
}

/** Errors and warnings across every source, flattened into a single list
 * in display order. */
export function findSourceWarnings(database: GedcomDatabase): SourceWarning[] {
  const result: SourceWarning[] = [];
  for (const source of Object.values(database.sources)) {
    const { errors, warnings } = sourceValidators(source, database);
    for (const error of errors) {
      result.push({
        source,
        severity: "Error",
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
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./source-warnings.component.html",
})
export class SourceWarningsComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(
    () =>
      findSourceWarnings(this.ancestryDatabase()).map((warning, index) => ({
        ...warning,
        key: `${index}`,
        ...this.fix(warning),
      })) satisfies ValidationRow[],
  );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }

  private fix(warning: SourceWarning): Omit<ValidationRow, "key"> {
    const sourceTab: TabInformation = {
      type: "SOUR",
      xref: warning.source.xref,
    };
    if (warning.urlSuggestion !== undefined) {
      const { matchedRepository } = warning.urlSuggestion;
      const { database, createdRepositoryXrefs } = applyUrlSuggestions(
        this.ancestryDatabase(),
        warning.source,
        [warning.urlSuggestion],
      );
      return {
        fixedDatabase: database,
        // The source first, then the repository the fix creates, if any.
        editorTabs: [
          sourceTab,
          ...createdRepositoryXrefs.map((xref): TabInformation => ({
            type: "REPO",
            xref,
          })),
        ],
        fixLabel: matchedRepository
          ? `Link to ${matchedRepository.name || matchedRepository.xref}`
          : "Create repository",
      };
    }
    if (warning.mergeSuggestion !== undefined) {
      return {
        fixedDatabase: applyMergeRepositoryLinksSuggestion(
          this.ancestryDatabase(),
          warning.source,
          warning.mergeSuggestion,
        ),
        editorTabs: [sourceTab],
        fixLabel: "Merge repository citations",
      };
    }
    return {};
  }
}
