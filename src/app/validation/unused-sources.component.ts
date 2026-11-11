import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { Immutable } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { getFamilySourceCitations } from "../../gedcom/gedcomFamily";
import { getIndividualSourceCitations } from "../../gedcom/gedcomIndividual";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";

/** Lists the sources that no citation anywhere in the database points to. */
@Component({
  selector: "app-unused-sources",
  imports: [RouterModule],
  templateUrl: "./unused-sources.component.html",
})
export class UnusedSourcesComponent {
  readonly ancestryDatabase = input.required<Immutable<GedcomDatabase>>();

  readonly unusedSources = computed(() =>
    findUnusedSources(this.ancestryDatabase()),
  );
}

export function findUnusedSources(gedcomDatabase: Immutable<GedcomDatabase>) {
  const cited = new Set(citedSourceXrefs(gedcomDatabase));
  return Object.values(gedcomDatabase.sources).filter(
    (source) => !cited.has(source.xref),
  );
}

function* citedSourceXrefs(
  gedcomDatabase: Immutable<GedcomDatabase>,
): Generator<string> {
  for (const individual of Object.values(gedcomDatabase.individuals)) {
    for (const { citation } of getIndividualSourceCitations(individual)) {
      yield citation.sourceXref;
    }
    // e.g. INDI.SOUR, which isn't parsed into a typed field yet.
    yield* fromUnknownRecords(individual.unknownRecords);
  }
  for (const family of Object.values(gedcomDatabase.families)) {
    for (const { citation } of getFamilySourceCitations(family)) {
      yield citation.sourceXref;
    }
    yield* fromUnknownRecords(family.unknownRecords);
  }
  for (const source of Object.values(gedcomDatabase.sources)) {
    yield* fromUnknownRecords(source.unknownRecords);
  }
}

function* fromUnknownRecords(
  records: readonly Immutable<GedcomRecord>[],
): Generator<string> {
  for (const record of records) {
    if (record.tag === "SOUR") yield record.value;
    yield* fromUnknownRecords(record.children);
  }
}
