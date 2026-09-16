import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomFamily } from "../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";
import type { GedcomRepository } from "../gedcom/gedcomRepository";
import type { GedcomSource } from "../gedcom/gedcomSource";

export function calculateNextIndividualXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase.individuals, "I");
}

export function calculateNextMultimediaXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase.multimedias, "M");
}

export function calculateNextRepositoryXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase.repositories, "R");
}

export function calculateNextSourceXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(gedcomDatabase.sources, "S");
}

function calculateNextXref(
  gedcomObjects: Record<
    string,
    | GedcomIndividual
    | GedcomRepository
    | GedcomSource
    | GedcomMultimedia
    | GedcomFamily
  >,
  prefix: string,
): string {
  const nextIndex = Object.values(gedcomObjects)
    .map((gedcomObject) => /^@[a-zA-Z]*(\d+)@/.exec(gedcomObject.xref)?.[1])
    .filter((xrefNumber) => xrefNumber !== undefined)
    .map((xrefNumber) => parseInt(xrefNumber))
    .reduce((acc, xrefNumber) => Math.max(acc, xrefNumber + 1), 0);
  return `@${prefix}${nextIndex}@`;
}
