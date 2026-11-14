import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomExternalIdentifier } from "../../gedcom/gedcomExternalIdentifier";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { familySearchPersonIdType } from "../../util/external-identifier-link";

/** The FamilySearch person ids in an individual's `_FSFTID` records (a
 * non-standard tag that RootsMagic and others write), which can move to a
 * standard EXID. A `_FSFTID` with child records of its own is left alone,
 * since an EXID has nowhere to keep them. */
export function familySearchIdsToConvert(
  individual: GedcomIndividual,
): string[] {
  return individual.unknownRecords
    .filter(
      (record) =>
        record.tag === "_FSFTID" &&
        record.value !== "" &&
        record.children.length === 0,
    )
    .map((record) => record.value);
}

/** Replaces each given individual's convertible `_FSFTID` records with EXIDs
 * of the FamilySearch person type, skipping an id the individual already
 * has as an EXID. Pure: returns a new database. */
export function applyFamilySearchIdSuggestion(
  database: GedcomDatabase,
  individualXrefs: string[],
): GedcomDatabase {
  return produce(database, (draft) => {
    for (const xref of individualXrefs) {
      const individual = draft.individuals[xref];
      if (individual === undefined) continue;
      const ids = familySearchIdsToConvert(individual);
      if (ids.length === 0) continue;
      individual.unknownRecords = individual.unknownRecords.filter(
        (record) =>
          !(
            record.tag === "_FSFTID" &&
            record.value !== "" &&
            record.children.length === 0
          ),
      );
      for (const id of ids) {
        const exists = individual.externalIdentifiers.some(
          (externalIdentifier) =>
            externalIdentifier.type === familySearchPersonIdType &&
            externalIdentifier.id === id,
        );
        if (!exists) {
          individual.externalIdentifiers.push(
            newGedcomExternalIdentifier({ id, type: familySearchPersonIdType }),
          );
        }
      }
    }
  });
}
