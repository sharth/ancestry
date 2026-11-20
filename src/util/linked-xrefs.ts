import type { GedcomFamily } from "../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomSource } from "../gedcom/gedcomSource";
import type { GedcomSourceCitation } from "../gedcom/gedcomSourceCitation";

/** Every xref an individual links to through its sex, names and facts.
 * Leaves out FAMS/FAMC, which only mirror the families' own links. */
export function* xrefsLinkedFromIndividual(
  individual: GedcomIndividual,
): Generator<string> {
  yield* xrefsLinkedFromSourceCitations(individual.sex.citations);
  for (const name of individual.names) {
    yield* xrefsLinkedFromSourceCitations(name.citations);
  }
  for (const fact of individual.facts) {
    yield* fact.sharedWith.map((sharedWith) => sharedWith.xref);
    yield* xrefsLinkedFromSourceCitations(fact.citations);
  }
}

export function* xrefsLinkedFromFamily(
  family: GedcomFamily,
): Generator<string> {
  yield family.husbandXref;
  yield family.wifeXref;
  yield* family.childXrefs;
  yield* xrefsLinkedFromSourceCitations(family.citations);
  for (const fact of family.facts) {
    yield* fact.sharedWith.map((sharedWith) => sharedWith.xref);
    yield* xrefsLinkedFromSourceCitations(fact.citations);
  }
}

export function* xrefsLinkedFromSource(
  source: GedcomSource,
): Generator<string> {
  yield* source.repositoryLinks.map((link) => link.repositoryXref);
  yield* source.multimediaLinks.map((link) => link.xref);
}

function* xrefsLinkedFromSourceCitations(
  citations: GedcomSourceCitation[],
): Generator<string> {
  for (const citation of citations) {
    yield citation.sourceXref;
    yield* citation.multimediaLinks.map((link) => link.xref);
  }
}
