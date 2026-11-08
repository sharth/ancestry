import type { AncestryService } from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import {
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "../../gedcom/gedcomRecord";

export interface GedcomRecordDifference {
  originalGedcomRecord?: GedcomRecord;
  updatedGedcomRecord?: GedcomRecord;
}

/** The records a suggested fix would change on disk: `updatedDatabase` is
 * `database` with the fix applied. Built from
 * AncestryService.compareGedcomDatabase(), the same diff the save path
 * writes from, but only over the records the fix actually changed (plus
 * HEAD), so it doesn't re-serialize the whole database for every preview.
 * The fixes are applied with immer, which keeps every record they don't
 * touch as the same object, so a record whose object is unchanged is
 * skipped -- along with any difference it has from the file that the fix
 * didn't cause, e.g. a tag the file spells differently than the app
 * writes it. */
export function suggestionDifferences(
  ancestryService: AncestryService,
  database: GedcomDatabase,
  updatedDatabase: GedcomDatabase,
): GedcomRecordDifference[] {
  const changedXrefs = new Set<string>();
  const changedDatabase = newGedcomDatabase({
    submitters: changedRecords(
      database.submitters,
      updatedDatabase.submitters,
      changedXrefs,
    ),
    individuals: changedRecords(
      database.individuals,
      updatedDatabase.individuals,
      changedXrefs,
    ),
    families: changedRecords(
      database.families,
      updatedDatabase.families,
      changedXrefs,
    ),
    sources: changedRecords(
      database.sources,
      updatedDatabase.sources,
      changedXrefs,
    ),
    repositories: changedRecords(
      database.repositories,
      updatedDatabase.repositories,
      changedXrefs,
    ),
    multimedias: changedRecords(
      database.multimedias,
      updatedDatabase.multimedias,
      changedXrefs,
    ),
  });

  return ancestryService
    .compareGedcomDatabase(changedDatabase)
    .filter(({ originalGedcomRecord, updatedGedcomRecord }) => {
      // Every record left out of `changedDatabase` comes back as an
      // original with no update; only a record the fix removed is a real
      // removal.
      if (updatedGedcomRecord == undefined) {
        return (
          originalGedcomRecord != undefined &&
          changedXrefs.has(originalGedcomRecord.xref)
        );
      }
      return (
        originalGedcomRecord == undefined ||
        serializeGedcomRecordToText(originalGedcomRecord).join("\n") !==
          serializeGedcomRecordToText(updatedGedcomRecord).join("\n")
      );
    });
}

/** The records in `updated` that aren't the same object as in `original`,
 * adding their xrefs -- and the xrefs of records removed from `original` --
 * to `changedXrefs`. */
function changedRecords<T>(
  original: Record<string, T>,
  updated: Record<string, T>,
  changedXrefs: Set<string>,
): Record<string, T> {
  const changed: Record<string, T> = {};
  for (const [xref, record] of Object.entries(updated)) {
    if (original[xref] === record) continue;
    changed[xref] = record;
    changedXrefs.add(xref);
  }
  for (const xref of Object.keys(original)) {
    if (!(xref in updated)) changedXrefs.add(xref);
  }
  return changed;
}
