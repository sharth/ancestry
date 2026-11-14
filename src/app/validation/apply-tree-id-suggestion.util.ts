import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomExternalIdentifier,
  type GedcomExternalIdentifier,
} from "../../gedcom/gedcomExternalIdentifier";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import {
  ancestryPersonIdType,
  familySearchPersonIdType,
} from "../../util/external-identifier-link";

// RootsMagic TreeShare's _AMTID is "<person id>:1030:<tree id>"; 1030 is
// Ancestry's collection id for member trees.
const ancestryTreeIdPattern = /^(\d+):1030:(\d+)$/;

/** The EXID a non-standard tree id record converts to, or undefined when it
 * isn't one: a `_FSFTID` (FamilySearch person id, written by RootsMagic and
 * others) or an `_AMTID` (RootsMagic TreeShare's Ancestry person and tree
 * ids). A record with child records of its own is left alone, since an EXID
 * has nowhere to keep them. */
export function externalIdentifierForTreeIdRecord(
  record: GedcomRecord,
): GedcomExternalIdentifier | undefined {
  if (record.value === "" || record.children.length > 0) return undefined;
  if (record.tag === "_FSFTID") {
    return newGedcomExternalIdentifier({
      id: record.value,
      type: familySearchPersonIdType,
    });
  }
  if (record.tag === "_AMTID") {
    const match = ancestryTreeIdPattern.exec(record.value);
    if (match?.[1] === undefined || match[2] === undefined) return undefined;
    return newGedcomExternalIdentifier({
      id: match[1],
      type: ancestryPersonIdType(match[2]),
    });
  }
  return undefined;
}

/** The EXIDs an individual's non-standard tree id records convert to. */
export function treeIdsToConvert(
  individual: GedcomIndividual,
): GedcomExternalIdentifier[] {
  return individual.unknownRecords.flatMap(
    (record) => externalIdentifierForTreeIdRecord(record) ?? [],
  );
}

/** Replaces each given individual's convertible `_FSFTID` and `_AMTID`
 * records with EXIDs, skipping an EXID the individual already has. Pure:
 * returns a new database. */
export function applyTreeIdSuggestion(
  database: GedcomDatabase,
  individualXrefs: string[],
): GedcomDatabase {
  return produce(database, (draft) => {
    for (const xref of individualXrefs) {
      const individual = draft.individuals[xref];
      if (individual === undefined) continue;
      const converted = treeIdsToConvert(individual);
      if (converted.length === 0) continue;
      individual.unknownRecords = individual.unknownRecords.filter(
        (record) => externalIdentifierForTreeIdRecord(record) === undefined,
      );
      for (const externalIdentifier of converted) {
        const exists = individual.externalIdentifiers.some(
          (existing) =>
            existing.type === externalIdentifier.type &&
            existing.id === externalIdentifier.id,
        );
        if (!exists) individual.externalIdentifiers.push(externalIdentifier);
      }
    }
  });
}
