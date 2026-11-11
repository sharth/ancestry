import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomFact } from "../../gedcom/gedcomFact";
import type { GedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import type { TabInformation } from "./gedcom-editor-interface";

function* allFacts(draft: GedcomDatabase): Generator<GedcomFact> {
  for (const individual of Object.values(draft.individuals)) {
    yield* individual.facts;
  }
  for (const family of Object.values(draft.families)) {
    yield* family.facts;
  }
}

/** Every place in the database that holds a `citations` array: an
 * individual's sex and each of its names, a family itself, and every fact
 * (individual or family). */
function* allCitationOwners(
  draft: GedcomDatabase,
): Generator<{ citations: GedcomSourceCitation[] }> {
  for (const individual of Object.values(draft.individuals)) {
    yield individual.sex;
    yield* individual.names;
  }
  yield* Object.values(draft.families);
  yield* allFacts(draft);
}

/** Deletes the record identified by `tabInformation` and scrubs every
 * cross-reference to it elsewhere in the database, so the result never has
 * a dangling xref pointing at a record that no longer exists. Pure --
 * doesn't mutate `database`. */
export function deleteGedcomRecord(
  database: GedcomDatabase,
  tabInformation: TabInformation,
): GedcomDatabase {
  const { type, xref } = tabInformation;
  return produce(database, (draft) => {
    switch (type) {
      case "INDI": {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.individuals[xref];
        for (const family of Object.values(draft.families)) {
          if (family.husbandXref === xref) family.husbandXref = "";
          if (family.wifeXref === xref) family.wifeXref = "";
          family.childXrefs = family.childXrefs.filter((x) => x !== xref);
        }
        for (const fact of allFacts(draft)) {
          fact.sharedWith = fact.sharedWith.filter((s) => s.xref !== xref);
        }
        break;
      }
      case "FAM": {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.families[xref];
        for (const individual of Object.values(draft.individuals)) {
          individual.parentOfFamilyXrefs =
            individual.parentOfFamilyXrefs.filter((x) => x !== xref);
          individual.childOfFamilyXrefs = individual.childOfFamilyXrefs.filter(
            (x) => x !== xref,
          );
        }
        break;
      }
      case "SOUR": {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.sources[xref];
        for (const owner of allCitationOwners(draft)) {
          owner.citations = owner.citations.filter(
            (citation) => citation.sourceXref !== xref,
          );
        }
        break;
      }
      case "REPO": {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.repositories[xref];
        for (const source of Object.values(draft.sources)) {
          source.repositoryLinks = source.repositoryLinks.filter(
            (link) => link.repositoryXref !== xref,
          );
        }
        break;
      }
      case "OBJE": {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.multimedias[xref];
        for (const source of Object.values(draft.sources)) {
          source.multimediaLinks = source.multimediaLinks.filter(
            (link) => link.xref !== xref,
          );
        }
        for (const owner of allCitationOwners(draft)) {
          for (const citation of owner.citations) {
            citation.multimediaLinks = citation.multimediaLinks.filter(
              (link) => link.xref !== xref,
            );
          }
        }
        break;
      }
      case "SUBM": {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete draft.submitters[xref];
        break;
      }
    }
  });
}
