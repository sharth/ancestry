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

/** Every record that would change on disk if `database` were saved as it
 * is -- e.g. a tag the file spells differently than the app writes it,
 * or HEAD's date. Built from AncestryService.compareGedcomDatabase(), the
 * same diff the save path writes from. Computed once per database and
 * handed to suggestionDifferences() for each suggested fix. */
export function databaseDifferences(
  ancestryService: AncestryService,
  database: GedcomDatabase,
): GedcomRecordDifference[] {
  return ancestryService.compareGedcomDatabase(database).filter(differs);
}

/** The records that would change on disk if `updatedDatabase` -- `database`
 * with a suggested fix applied -- were saved: the same list
 * databaseDifferences() would give for `updatedDatabase`, in the same
 * order, but without re-serializing the whole database for every
 * preview. The fixes are applied with immer, which keeps every record they
 * don't touch as the same object, so only the records whose object changed
 * (plus HEAD) are serialized again; every other record's difference, if
 * any, is taken from `baseline`, databaseDifferences() for `database`. */
export function suggestionDifferences(
  ancestryService: AncestryService,
  database: GedcomDatabase,
  baseline: GedcomRecordDifference[],
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

  const baselineByOriginal = new Map<GedcomRecord, GedcomRecordDifference>();
  for (const difference of baseline) {
    if (difference.originalGedcomRecord !== undefined) {
      baselineByOriginal.set(difference.originalGedcomRecord, difference);
    }
  }

  // compareGedcomDatabase lists every record in the file, in file order.
  // A record left out of `changedDatabase` comes back as an original with
  // no update: the fix didn't touch it, so it differs exactly as it does
  // in `baseline`.
  const result: GedcomRecordDifference[] = [];
  for (const difference of ancestryService.compareGedcomDatabase(
    changedDatabase,
  )) {
    const { originalGedcomRecord, updatedGedcomRecord } = difference;
    if (
      updatedGedcomRecord === undefined &&
      originalGedcomRecord !== undefined &&
      !changedXrefs.has(originalGedcomRecord.xref)
    ) {
      const untouched = baselineByOriginal.get(originalGedcomRecord);
      if (untouched !== undefined) result.push(untouched);
    } else if (differs(difference)) {
      result.push(difference);
    }
  }
  // Untouched records that aren't in the file at all come last, as they do
  // in compareGedcomDatabase.
  for (const difference of baseline) {
    if (
      difference.originalGedcomRecord === undefined &&
      difference.updatedGedcomRecord !== undefined &&
      difference.updatedGedcomRecord.tag !== "HEAD" &&
      difference.updatedGedcomRecord.tag !== "TRLR" &&
      !changedXrefs.has(difference.updatedGedcomRecord.xref)
    ) {
      result.push(difference);
    }
  }
  return result;
}

function differs({
  originalGedcomRecord,
  updatedGedcomRecord,
}: GedcomRecordDifference): boolean {
  return (
    originalGedcomRecord == undefined ||
    updatedGedcomRecord == undefined ||
    serializeGedcomRecordToText(originalGedcomRecord).join("\n") !==
      serializeGedcomRecordToText(updatedGedcomRecord).join("\n")
  );
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
