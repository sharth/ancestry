import { reportUnparsedRecord } from "../util/record-unparsed-records";
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

function hashGedcomRecord(gedcomRecord: GedcomRecord) {
  return `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
}

/** Every record in `gedcomDatabase` (the parse of `originalGedcomRecords`)
 * serialized, keyed by the parsed record object. Where a serialization
 * matches the file's own record exactly, the file's record object itself
 * is stored, so that comparing an untouched record against the file comes
 * down to an identity check. Worked out once when the file is loaded, and
 * handed to compareGedcomDatabase(): an edit applied with immer leaves
 * every record it doesn't touch as the same object, so those records
 * don't need serializing again. */
export function serializeGedcomDatabaseRecords(
  originalGedcomRecords: GedcomRecord[],
  gedcomDatabase: GedcomDatabase,
): Map<unknown, GedcomRecord> {
  const originalByHash = new Map<string, GedcomRecord>();
  for (const gedcomRecord of originalGedcomRecords) {
    originalByHash.set(hashGedcomRecord(gedcomRecord), gedcomRecord);
  }
  const serializations = new Map<unknown, GedcomRecord>();
  function add<T>(
    records: Record<string, T>,
    serialize: (record: T) => GedcomRecord,
  ) {
    for (const record of Object.values(records)) {
      const serialized = serialize(record);
      const original = originalByHash.get(hashGedcomRecord(serialized));
      serializations.set(
        record,
        original !== undefined &&
          serializeGedcomRecordToText(original).join("\n") ===
            serializeGedcomRecordToText(serialized).join("\n")
          ? original
          : serialized,
      );
    }
  }
  add(gedcomDatabase.submitters, serializeGedcomSubmitter);
  add(gedcomDatabase.individuals, serializeGedcomIndividual);
  add(gedcomDatabase.families, serializeGedcomFamily);
  add(gedcomDatabase.sources, serializeGedcomSource);
  add(gedcomDatabase.repositories, serializeGedcomRepository);
  add(gedcomDatabase.multimedias, serializeGedcomMultimedia);
  return serializations;
}

/** Pairs the original file's records with `updatedGedcomDatabase`'s,
 * serialized. A record found in `originalSerializations`
 * (serializeGedcomDatabaseRecords()) -- i.e. still the same object as when
 * the file was parsed -- is taken from there rather than serialized
 * again. */
export function compareGedcomDatabase(
  originalGedcomRecords: GedcomRecord[],
  updatedGedcomDatabase: GedcomDatabase,
  originalSerializations = new Map<unknown, GedcomRecord>(),
): {
  originalGedcomRecord?: GedcomRecord;
  updatedGedcomRecord?: GedcomRecord;
}[] {
  const hash = hashGedcomRecord;
  function serialize<T>(record: T, serializer: (record: T) => GedcomRecord) {
    return originalSerializations.get(record) ?? serializer(record);
  }
  const recordMap = new Map<
    string,
    { originalGedcomRecord?: GedcomRecord; updatedGedcomRecord?: GedcomRecord }
  >();
  originalGedcomRecords.forEach((gedcomRecord) => {
    recordMap.set(hash(gedcomRecord), { originalGedcomRecord: gedcomRecord });
  });

  [
    serializeGedcomHeader(generateGedcomHeader()),
    ...Object.values(updatedGedcomDatabase.submitters).map((s) =>
      serialize(s, serializeGedcomSubmitter),
    ),
    ...Object.values(updatedGedcomDatabase.individuals).map((i) =>
      serialize(i, serializeGedcomIndividual),
    ),
    ...Object.values(updatedGedcomDatabase.families).map((f) =>
      serialize(f, serializeGedcomFamily),
    ),
    ...Object.values(updatedGedcomDatabase.sources).map((s) =>
      serialize(s, serializeGedcomSource),
    ),
    ...Object.values(updatedGedcomDatabase.repositories).map((r) =>
      serialize(r, serializeGedcomRepository),
    ),
    ...Object.values(updatedGedcomDatabase.multimedias).map((m) =>
      serialize(m, serializeGedcomMultimedia),
    ),
    newGedcomRecord({ tag: "TRLR" }),
  ].forEach((gedcomRecord: GedcomRecord) => {
    const h = hash(gedcomRecord);
    const r = recordMap.get(h);
    if (r === undefined) {
      recordMap.set(h, { updatedGedcomRecord: gedcomRecord });
    } else {
      r.updatedGedcomRecord = gedcomRecord;
    }
  });

  return recordMap.values().toArray();
}

export function serializeGedcomDatabase(
  originalGedcomRecords: GedcomRecord[],
  gedcomDatabase: GedcomDatabase,
  originalSerializations?: Map<unknown, GedcomRecord>,
): string[] {
  return compareGedcomDatabase(
    originalGedcomRecords,
    gedcomDatabase,
    originalSerializations,
  )
    .map(({ updatedGedcomRecord }) => updatedGedcomRecord)
    .filter((r) => r != null)
    .flatMap((r) => serializeGedcomRecordToText(r));
}
