import type { Immutable } from "immer";
import { Component, computed, input, output, signal } from "@angular/core";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";
import { bestMatchRank, type MatchRank } from "../search/search.util";
import type { TabInformation } from "./gedcom-editor-interface";

interface ExistingRecord {
  tab: TabInformation;
  icon: string;
  label: string;
}

const maxResults = 10;

// A search box in the editor's "Add to Session" menu that finds a record
// already in the database (individual, family, source, repository or
// multimedia) by name or xref, so it can be opened as a session tab.
@Component({
  selector: "app-open-existing-record",
  templateUrl: "./open-existing-record.component.html",
})
export class OpenExistingRecordComponent {
  readonly workingDatabase = input.required<Immutable<GedcomDatabase>>();
  readonly opened = output<TabInformation>();

  readonly query = signal("");

  readonly records = computed<ExistingRecord[]>(() => {
    const database = this.workingDatabase();
    const nameOf = (xref: string) => {
      const individual = database.individuals[xref];
      return individual ? fullname(individual) : "";
    };
    return [
      ...Object.values(database.individuals).map((individual) => ({
        tab: { type: "INDI" as const, xref: individual.xref },
        icon: "bi-person",
        label: fullname(individual) || "Unnamed individual",
      })),
      ...Object.values(database.families).map((family) => ({
        tab: { type: "FAM" as const, xref: family.xref },
        icon: "bi-people",
        label:
          [nameOf(family.husbandXref), nameOf(family.wifeXref)]
            .filter(Boolean)
            .join(" & ") || "Family",
      })),
      ...Object.values(database.sources).map((source) => ({
        tab: { type: "SOUR" as const, xref: source.xref },
        icon: "bi-journal-bookmark",
        label: source.abbr || source.title || "Untitled source",
      })),
      ...Object.values(database.repositories).map((repository) => ({
        tab: { type: "REPO" as const, xref: repository.xref },
        icon: "bi-building",
        label: repository.name || "Unnamed repository",
      })),
      ...Object.values(database.multimedias).map((multimedia) => ({
        tab: { type: "OBJE" as const, xref: multimedia.xref },
        icon: "bi-image",
        label: multimedia.title || multimedia.filePath || "Untitled multimedia",
      })),
    ];
  });

  // The best matches for the query, by label or xref (with or without
  // its @ delimiters), exact matches first, then prefixes, then the rest.
  readonly results = computed<ExistingRecord[]>(() => {
    const query = this.query().trim();
    if (!query) return [];
    const ranked: { record: ExistingRecord; rank: MatchRank }[] = [];
    for (const record of this.records()) {
      const xref = record.tab.xref;
      const rank = bestMatchRank(
        [record.label, xref, xref.replace(/^@(.*)@$/, "$1")],
        query,
      );
      if (rank !== undefined) ranked.push({ record, rank });
    }
    return ranked
      .sort(
        (a, b) =>
          a.rank - b.rank || a.record.label.localeCompare(b.record.label),
      )
      .slice(0, maxResults)
      .map(({ record }) => record);
  });

  open(record: ExistingRecord) {
    this.query.set("");
    this.opened.emit(record.tab);
  }

  // Enter opens the top result, rather than submitting the editor's form.
  openFirstResult(event: Event) {
    event.preventDefault();
    const first = this.results()[0];
    if (first) this.open(first);
  }
}
