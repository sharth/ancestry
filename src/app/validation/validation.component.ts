import { Component, computed, input, signal, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

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
  type UrlRepositorySuggestion,
} from "./source-validators";

@Component({
  selector: "app-validation",
  imports: [RouterModule, GedcomEditorDialogComponent, GedcomDiffComponent],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
})
export class ValidationComponent implements ComponentWithUnsavedChanges {
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

  private readonly reviewSuggestion = computed(() => {
    const xref = this.reviewXref();
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
  });

  review(xref: string) {
    this.reviewXref.set(xref);
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
