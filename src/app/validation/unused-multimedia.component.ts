import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { Immutable } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";

/** Lists the multimedia records that no multimedia link anywhere in the
 * database points to. */
@Component({
  selector: "app-unused-multimedia",
  imports: [RouterModule],
  templateUrl: "./unused-multimedia.component.html",
})
export class UnusedMultimediaComponent {
  readonly ancestryDatabase = input.required<Immutable<GedcomDatabase>>();

  readonly unusedMultimedia = computed(() =>
    findUnusedMultimedia(this.ancestryDatabase()),
  );
}

export function findUnusedMultimedia(
  gedcomDatabase: Immutable<GedcomDatabase>,
) {
  const linked = new Set(linkedMultimediaXrefs(gedcomDatabase));
  return Object.values(gedcomDatabase.multimedias).filter(
    (multimedia) => !linked.has(multimedia.xref),
  );
}

function* linkedMultimediaXrefs(
  gedcomDatabase: Immutable<GedcomDatabase>,
): Generator<string> {
  for (const individual of Object.values(gedcomDatabase.individuals)) {
    yield* fromCitations(individual.sex.citations);
    for (const name of individual.names) {
      yield* fromCitations(name.citations);
    }
    for (const fact of individual.facts) {
      yield* fromCitations(fact.citations);
    }
    // e.g. INDI.OBJE, which isn't parsed into a typed field yet.
    yield* fromUnknownRecords(individual.unknownRecords);
  }
  for (const family of Object.values(gedcomDatabase.families)) {
    yield* fromCitations(family.citations);
    for (const fact of family.facts) {
      yield* fromCitations(fact.citations);
    }
    yield* fromUnknownRecords(family.unknownRecords);
  }
  for (const source of Object.values(gedcomDatabase.sources)) {
    yield* source.multimediaLinks.map((link) => link.xref);
    yield* fromUnknownRecords(source.unknownRecords);
  }
}

function* fromCitations(
  citations: readonly Immutable<GedcomSourceCitation>[],
): Generator<string> {
  for (const citation of citations) {
    yield* citation.multimediaLinks.map((link) => link.xref);
  }
}

function* fromUnknownRecords(
  records: readonly GedcomRecord[],
): Generator<string> {
  for (const record of records) {
    if (record.tag === "OBJE") yield record.value;
    yield* fromUnknownRecords(record.children);
  }
}
