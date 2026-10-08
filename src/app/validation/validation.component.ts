import { Component, computed, input, signal } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import {
  serializeGedcomSource,
  type GedcomSource,
} from "../../gedcom/gedcomSource";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import { applyUrlSuggestion } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type UrlRepositorySuggestion,
} from "./source-validators";

@Component({
  selector: "app-validation",
  imports: [RouterModule, GedcomEditorDialogComponent],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
})
export class ValidationComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

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

  beforeGedcomText(source: GedcomSource): string {
    return serializeGedcomRecordToText(serializeGedcomSource(source)).join(
      "\n",
    );
  }

  // The source (and, when one is newly created, the repository) as they'd
  // look after `suggestion` is applied -- a preview only, computed fresh
  // each time rather than reusing `reviewDatabase` so it stays correct even
  // when nothing has been selected for review yet.
  afterGedcomText(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ): string {
    const { database, repositoryXref } = applyUrlSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    const updatedSource = database.sources[source.xref];
    if (updatedSource === undefined) return "";

    const blocks = [
      serializeGedcomRecordToText(serializeGedcomSource(updatedSource)).join(
        "\n",
      ),
    ];
    if (suggestion.matchedRepository === undefined) {
      const newRepository = database.repositories[repositoryXref];
      if (newRepository !== undefined) {
        blocks.push(
          serializeGedcomRecordToText(
            serializeGedcomRepository(newRepository),
          ).join("\n"),
        );
      }
    }
    return blocks.join("\n\n");
  }
}
