import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  generateChangeDate,
  newGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  parseGedcomFamily,
  serializeGedcomFamily,
  type GedcomFamily,
} from "./gedcomFamily";
import {
  generateGedcomHeader,
  parseGedcomHeader,
  serializeGedcomHeader,
  type GedcomHeader,
} from "./gedcomHeader";
import {
  parseGedcomIndividual,
  serializeGedcomIndividual,
  type GedcomIndividual,
} from "./gedcomIndividual";
import {
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
  type GedcomMultimedia,
} from "./gedcomMultimedia";
import {
  newGedcomRecord,
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  parseGedcomRepository,
  serializeGedcomRepository,
  type GedcomRepository,
} from "./gedcomRepository";
import {
  parseGedcomSource,
  serializeGedcomSource,
  type GedcomSource,
} from "./gedcomSource";
import {
  parseGedcomSubmitter,
  serializeGedcomSubmitter,
  type GedcomSubmitter,
} from "./gedcomSubmitter";
import { parseGedcomTrailer, type GedcomTrailer } from "./gedcomTrailer";

export interface GedcomDatabase {
  submitters: Record<string, GedcomSubmitter>;
  individuals: Record<string, GedcomIndividual>;
  families: Record<string, GedcomFamily>;
  sources: Record<string, GedcomSource>;
  repositories: Record<string, GedcomRepository>;
  multimedias: Record<string, GedcomMultimedia>;
}

export function newGedcomDatabase(
  fieldsToUpdate: Partial<GedcomDatabase> = {},
): GedcomDatabase {
  return {
    submitters: {},
    individuals: {},
    families: {},
    sources: {},
    repositories: {},
    multimedias: {},
    ...fieldsToUpdate,
  };
}

export function parseGedcomDatabase(gedcomRecords: GedcomRecord[]) {
  const gedcomDatabase = newGedcomDatabase();
  const headers: GedcomHeader[] = [];
  const trailers: GedcomTrailer[] = [];

  for (const gedcomRecord of gedcomRecords) {
    switch (gedcomRecord.tag) {
      case "HEAD":
        headers.push(parseGedcomHeader(gedcomRecord));
        break;
      case "TRLR":
        trailers.push(parseGedcomTrailer(gedcomRecord));
        break;
      case "SUBM": {
        const submitter = parseGedcomSubmitter(gedcomRecord);
        gedcomDatabase.submitters[submitter.xref] = submitter;
        break;
      }
      case "INDI": {
        const individual = parseGedcomIndividual(gedcomRecord);
        gedcomDatabase.individuals[individual.xref] = individual;
        break;
      }
      case "FAM": {
        const family = parseGedcomFamily(gedcomRecord);
        gedcomDatabase.families[family.xref] = family;
        break;
      }
      case "REPO": {
        const repository = parseGedcomRepository(gedcomRecord);
        gedcomDatabase.repositories[repository.xref] = repository;
        break;
      }
      case "SOUR": {
        const source = parseGedcomSource(gedcomRecord);
        gedcomDatabase.sources[source.xref] = source;
        break;
      }
      case "OBJE": {
        const multimedia = parseGedcomMultimedia(gedcomRecord);
        gedcomDatabase.multimedias[multimedia.xref] = multimedia;
        break;
      }
      default:
        reportUnparsedRecord(gedcomRecord);
        break;
    }
  }

  // For whatever reason, GEDCOM has the family references in both the FAM and INDI.
  // Ensure that these are consistent.
  for (const family of Object.values(gedcomDatabase.families)) {
    if (family.husbandXref) {
      const husband = gedcomDatabase.individuals[family.husbandXref];
      if (!husband) throw new Error();
      if (!husband.parentOfFamilyXrefs.includes(family.xref)) throw new Error();
    }
    if (family.wifeXref) {
      const wife = gedcomDatabase.individuals[family.wifeXref];
      if (!wife) throw new Error();
      if (!wife.parentOfFamilyXrefs.includes(family.xref)) throw new Error();
    }
    for (const childXref of family.childXrefs) {
      const child = gedcomDatabase.individuals[childXref];
      if (!child) throw new Error();
      if (!child.childOfFamilyXrefs.includes(family.xref)) throw new Error();
    }
  }
  for (const individual of Object.values(gedcomDatabase.individuals)) {
    for (const familyXref of individual.parentOfFamilyXrefs) {
      const family = gedcomDatabase.families[familyXref];
      const parents = [family?.husbandXref, family?.wifeXref].filter(
        (e) => e != null,
      );
      if (!family) throw new Error();
      if (!parents.includes(individual.xref)) throw new Error();
    }
    for (const familyXref of individual.childOfFamilyXrefs) {
      const family = gedcomDatabase.families[familyXref];
      if (!family) throw new Error();
      if (!family.childXrefs.includes(individual.xref)) throw new Error();
    }
  }
  return gedcomDatabase;
}

function hashRecord(gedcomRecord: GedcomRecord): string {
  return `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
}

// Builds the hash -> original-record lookup once, shared by
// `compareGedcomDatabase` (which also uses it to seed the diff) and
// `stampChangeDates` (which builds its own when called standalone).
function buildOriginalByHash(
  originalGedcomRecords: GedcomRecord[],
): Map<string, GedcomRecord> {
  return new Map(
    originalGedcomRecords.map((record) => [hashRecord(record), record]),
  );
}

// Diffs `originalGedcomRecords` (the file as currently on disk) against
// `updatedGedcomDatabase` (the in-memory, edited database), one entry per
// record on either side. Stamps CHAN on whatever actually changed before
// diffing, so every caller -- the editor's live diff, the validation
// page's before/after preview, and the file `serializeGedcomDatabase()`
// writes -- sees and saves the same change date, without each having to
// remember to stamp it first.
export function compareGedcomDatabase(
  originalGedcomRecords: GedcomRecord[],
  updatedGedcomDatabase: GedcomDatabase,
): {
  originalGedcomRecord?: GedcomRecord;
  updatedGedcomRecord?: GedcomRecord;
}[] {
  const originalByHash = buildOriginalByHash(originalGedcomRecords);
  const stampedGedcomDatabase = stampChangeDatesUsing(
    originalByHash,
    updatedGedcomDatabase,
  );

  const recordMap = new Map<
    string,
    { originalGedcomRecord?: GedcomRecord; updatedGedcomRecord?: GedcomRecord }
  >();
  originalByHash.forEach((gedcomRecord, h) => {
    recordMap.set(h, { originalGedcomRecord: gedcomRecord });
  });

  [
    serializeGedcomHeader(generateGedcomHeader()),
    ...Object.values(stampedGedcomDatabase.submitters).map((s) =>
      serializeGedcomSubmitter(s),
    ),
    ...Object.values(stampedGedcomDatabase.individuals).map((i) =>
      serializeGedcomIndividual(i),
    ),
    ...Object.values(stampedGedcomDatabase.families).map((f) =>
      serializeGedcomFamily(f),
    ),
    ...Object.values(stampedGedcomDatabase.sources).map((s) =>
      serializeGedcomSource(s),
    ),
    ...Object.values(stampedGedcomDatabase.repositories).map((r) =>
      serializeGedcomRepository(r),
    ),
    ...Object.values(stampedGedcomDatabase.multimedias).map((m) =>
      serializeGedcomMultimedia(m),
    ),
    newGedcomRecord({ tag: "TRLR" }),
  ].forEach((gedcomRecord: GedcomRecord) => {
    const h = hashRecord(gedcomRecord);
    const r = recordMap.get(h);
    if (r === undefined) {
      recordMap.set(h, { updatedGedcomRecord: gedcomRecord });
    } else {
      r.updatedGedcomRecord = gedcomRecord;
    }
  });

  return recordMap.values().toArray();
}

function withoutChangeDate(record: GedcomRecord): GedcomRecord {
  return {
    ...record,
    children: record.children.filter((child) => child.tag !== "CHAN"),
  };
}

// Whether `updatedRecord` (one entity's freshly serialized record, with its
// CHAN blanked out so it never carries one) differs from the matching
// record in `originalGedcomRecords`, ignoring each side's own CHAN child --
// so a record whose only difference is a stale/missing CHAN doesn't itself
// count as changed.
function contentChanged(
  originalByHash: Map<string, GedcomRecord>,
  updatedRecord: GedcomRecord,
): boolean {
  const original = originalByHash.get(hashRecord(updatedRecord));
  if (original === undefined) return true;
  return (
    serializeGedcomRecordToText(withoutChangeDate(original)).join("\n") !==
    serializeGedcomRecordToText(withoutChangeDate(updatedRecord)).join("\n")
  );
}

// Stamps CHAN (change date) on every individual, source, and multimedia
// record whose content differs from the original, given an already-built
// hash -> original-record lookup. `compareGedcomDatabase` calls this with
// the lookup it already built, so the records aren't hashed twice; the
// exported `stampChangeDates` below builds the lookup itself for standalone
// callers like the validation page's suggestion previews, which need one
// already-stamped record rather than a diff. Limited to the record types
// that already parse/serialize CHANGE_DATE (GEDCOM 5.5.1 p. 31).
function stampChangeDatesUsing(
  originalByHash: Map<string, GedcomRecord>,
  database: GedcomDatabase,
  changeDate: GedcomChangeDate = generateChangeDate(),
): GedcomDatabase {
  return {
    ...database,
    individuals: Object.fromEntries(
      Object.entries(database.individuals).map(([xref, individual]) => [
        xref,
        contentChanged(
          originalByHash,
          serializeGedcomIndividual({
            ...individual,
            changeDate: newGedcomChangeDate(),
          }),
        )
          ? { ...individual, changeDate }
          : individual,
      ]),
    ),
    sources: Object.fromEntries(
      Object.entries(database.sources).map(([xref, source]) => [
        xref,
        contentChanged(
          originalByHash,
          serializeGedcomSource({
            ...source,
            changeDate: newGedcomChangeDate(),
          }),
        )
          ? { ...source, changeDate }
          : source,
      ]),
    ),
    multimedias: Object.fromEntries(
      Object.entries(database.multimedias).map(([xref, multimedia]) => [
        xref,
        contentChanged(
          originalByHash,
          serializeGedcomMultimedia({ ...multimedia, changeDate: undefined }),
        )
          ? { ...multimedia, changeDate }
          : multimedia,
      ]),
    ),
  };
}

export function stampChangeDates(
  originalGedcomRecords: GedcomRecord[],
  database: GedcomDatabase,
  changeDate: GedcomChangeDate = generateChangeDate(),
): GedcomDatabase {
  return stampChangeDatesUsing(
    buildOriginalByHash(originalGedcomRecords),
    database,
    changeDate,
  );
}

export function serializeGedcomDatabase(
  originalGedcomRecords: GedcomRecord[],
  gedcomDatabase: GedcomDatabase,
): string[] {
  return compareGedcomDatabase(originalGedcomRecords, gedcomDatabase)
    .map(({ updatedGedcomRecord }) => updatedGedcomRecord)
    .filter((r) => r != null)
    .flatMap((r) => serializeGedcomRecordToText(r));
}
