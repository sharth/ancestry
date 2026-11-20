import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import {
  xrefsLinkedFromFamily,
  xrefsLinkedFromIndividual,
  xrefsLinkedFromSource,
} from "./linked-xrefs";

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

  for (const individual of Object.values(gedcomDatabase.individuals)) {
    yield* individual.parentOfFamilyXrefs;
    yield* individual.childOfFamilyXrefs;
    yield* xrefsLinkedFromIndividual(individual);
  }
  for (const family of Object.values(gedcomDatabase.families)) {
    yield* xrefsLinkedFromFamily(family);
  }
  for (const source of Object.values(gedcomDatabase.sources)) {
    yield* xrefsLinkedFromSource(source);
  }
}

function calculateNextXref(
  gedcomDatabase: GedcomDatabase,
  prefix: string,
): string {
  const pattern = new RegExp(`^@${prefix}(\\d+)@$`);
  const nextIndex = usedXrefs(gedcomDatabase)
    .map((xref) => pattern.exec(xref)?.[1])
    .filter((xrefNumber) => xrefNumber !== undefined)
    .map((xrefNumber) => parseInt(xrefNumber))
    .reduce((acc, xrefNumber) => Math.max(acc, xrefNumber + 1), 0);
  return `@${prefix}${nextIndex}@`;
}
