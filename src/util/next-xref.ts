import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomSourceCitation } from "../gedcom/gedcomSourceCitation";

export function calculateNextIndividualXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase, "I");
}

export function calculateNextMultimediaXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase, "M");
}

export function calculateNextRepositoryXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase, "R");
}

export function calculateNextSourceXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase, "S");
}

export function calculateNextFamilyXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase, "F");
}

export function calculateNextSubmitterXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase, "U");
}

/** Every xref the database uses: each record's own xref, plus every xref
 * something links to, even when no record with that xref exists. */
function* usedXrefs(gedcomDatabase: GedcomDatabase): Generator<string> {
  yield* Object.keys(gedcomDatabase.submitters);
  yield* Object.keys(gedcomDatabase.individuals);
  yield* Object.keys(gedcomDatabase.families);
  yield* Object.keys(gedcomDatabase.sources);
  yield* Object.keys(gedcomDatabase.repositories);
  yield* Object.keys(gedcomDatabase.multimedias);

  const citations: GedcomSourceCitation[] = [];
  for (const individual of Object.values(gedcomDatabase.individuals)) {
    yield* individual.parentOfFamilyXrefs;
    yield* individual.childOfFamilyXrefs;
    citations.push(...individual.sex.citations);
    for (const name of individual.names) citations.push(...name.citations);
    for (const fact of individual.facts) {
      yield* fact.sharedWith.map((sharedWith) => sharedWith.xref);
      citations.push(...fact.citations);
    }
  }
  for (const family of Object.values(gedcomDatabase.families)) {
    yield family.husbandXref;
    yield family.wifeXref;
    yield* family.childXrefs;
    citations.push(...family.citations);
    for (const fact of family.facts) {
      yield* fact.sharedWith.map((sharedWith) => sharedWith.xref);
      citations.push(...fact.citations);
    }
  }
  for (const source of Object.values(gedcomDatabase.sources)) {
    yield* source.repositoryLinks.map((link) => link.repositoryXref);
    yield* source.multimediaLinks.map((link) => link.xref);
  }
  for (const citation of citations) {
    yield citation.sourceXref;
    yield* citation.multimediaLinks.map((link) => link.xref);
  }
}

function calculateNextXref(
  gedcomDatabase: GedcomDatabase,
  prefix: string,
): string {
  const nextIndex = [...usedXrefs(gedcomDatabase)]
    .map((xref) => new RegExp(`^@${prefix}(\\d+)@$`).exec(xref)?.[1])
    .filter((xrefNumber) => xrefNumber !== undefined)
    .map((xrefNumber) => parseInt(xrefNumber))
    .reduce((acc, xrefNumber) => Math.max(acc, xrefNumber + 1), 0);
  return `@${prefix}${nextIndex}@`;
}
