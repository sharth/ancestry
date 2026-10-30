import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomFact } from "../gedcom/gedcomFact";
import type { GedcomSourceCitation } from "../gedcom/gedcomSourceCitation";

// Each calculator also considers xrefs that are only linked to (e.g. a
// family's HUSB pointing at an individual with no INDI record), so a new
// record never takes an xref that something already points at.

export function calculateNextIndividualXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(
    [
      ...Object.keys(gedcomDatabase.individuals),
      ...linkedIndividualXrefs(gedcomDatabase),
    ],
    "I",
  );
}

export function calculateNextMultimediaXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(
    [
      ...Object.keys(gedcomDatabase.multimedias),
      ...linkedMultimediaXrefs(gedcomDatabase),
    ],
    "M",
  );
}

export function calculateNextRepositoryXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(
    [
      ...Object.keys(gedcomDatabase.repositories),
      ...Object.values(gedcomDatabase.sources).flatMap((source) =>
        source.repositoryLinks.map((link) => link.repositoryXref),
      ),
    ],
    "R",
  );
}

export function calculateNextSourceXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(
    [
      ...Object.keys(gedcomDatabase.sources),
      ...allCitations(gedcomDatabase).map((citation) => citation.sourceXref),
    ],
    "S",
  );
}

export function calculateNextFamilyXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(
    [
      ...Object.keys(gedcomDatabase.families),
      ...Object.values(gedcomDatabase.individuals).flatMap((individual) => [
        ...individual.parentOfFamilyXrefs,
        ...individual.childOfFamilyXrefs,
      ]),
    ],
    "F",
  );
}

export function calculateNextSubmitterXref(gedcomDatabase: GedcomDatabase) {
  return calculateNextXref(Object.keys(gedcomDatabase.submitters), "U");
}

function linkedIndividualXrefs(gedcomDatabase: GedcomDatabase): string[] {
  return [
    ...Object.values(gedcomDatabase.families).flatMap((family) => [
      family.husbandXref,
      family.wifeXref,
      ...family.childXrefs,
    ]),
    ...allFacts(gedcomDatabase).flatMap((fact) =>
      fact.sharedWith.map((sharedWith) => sharedWith.xref),
    ),
  ];
}

function linkedMultimediaXrefs(gedcomDatabase: GedcomDatabase): string[] {
  return [
    ...Object.values(gedcomDatabase.sources).flatMap((source) =>
      source.multimediaLinks.map((link) => link.xref),
    ),
    ...allCitations(gedcomDatabase).flatMap((citation) =>
      citation.multimediaLinks.map((link) => link.xref),
    ),
  ];
}

function allFacts(gedcomDatabase: GedcomDatabase): GedcomFact[] {
  return [
    ...Object.values(gedcomDatabase.individuals).flatMap((i) => i.facts),
    ...Object.values(gedcomDatabase.families).flatMap((f) => f.facts),
  ];
}

function allCitations(gedcomDatabase: GedcomDatabase): GedcomSourceCitation[] {
  return [
    ...Object.values(gedcomDatabase.individuals).flatMap((individual) => [
      ...individual.sex.citations,
      ...individual.names.flatMap((name) => name.citations),
    ]),
    ...Object.values(gedcomDatabase.families).flatMap(
      (family) => family.citations,
    ),
    ...allFacts(gedcomDatabase).flatMap((fact) => fact.citations),
  ];
}

function calculateNextXref(xrefs: string[], prefix: string): string {
  const nextIndex = xrefs
    .map((xref) => /^@[a-zA-Z]*(\d+)@/.exec(xref)?.[1])
    .filter((xrefNumber) => xrefNumber !== undefined)
    .map((xrefNumber) => parseInt(xrefNumber))
    .reduce((acc, xrefNumber) => Math.max(acc, xrefNumber + 1), 0);
  return `@${prefix}${nextIndex}@`;
}
