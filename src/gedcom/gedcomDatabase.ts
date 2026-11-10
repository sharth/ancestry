import {
  reportUnparsedRecord,
  warnUnparsedRecords,
} from "../util/record-unparsed-records";
import { newGedcomChangeDate, type GedcomChangeDate } from "./gedcomChangeDate";
import {
  newGedcomCreationDate,
  type GedcomCreationDate,
} from "./gedcomCreationDate";
import { gedcomDateExact } from "./gedcomDate";
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
  warnUnparsedRecords(gedcomRecords);

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

/** `updatedGedcomObject`, with `date` as its CHAN unless it is still
 * `originalGedcomObject`, and also as its CREA when there was no original
 * (a new record). Edits go through immer, which keeps every untouched object
 * the same object, so "edited" is just "not the original object". */
function stampDates<
  GedcomObject extends {
    changeDate?: GedcomChangeDate;
    creationDate?: GedcomCreationDate;
  },
>(
  originalGedcomObject: GedcomObject | undefined,
  updatedGedcomObject: GedcomObject,
  date: string,
): GedcomObject {
  if (originalGedcomObject === updatedGedcomObject) {
    return updatedGedcomObject;
  } else if (originalGedcomObject === undefined) {
    const changeDate = newGedcomChangeDate({ value: date });
    const creationDate = newGedcomCreationDate({ value: date });
    return { ...updatedGedcomObject, changeDate, creationDate };
  } else {
    const changeDate = newGedcomChangeDate({ value: date });
    return { ...updatedGedcomObject, changeDate };
  }
}

/** Pairs the original file's records with `updatedGedcomDatabase`'s,
 * serialized. Records that are new or edited relative to
 * `originalGedcomDatabase` (the parse of `originalGedcomRecords`) get their
 * CHAN stamped with `now`, and new ones their CREA too, as HEAD gets its
 * DATE. */
export function compareGedcomDatabase(
  originalGedcomRecords: GedcomRecord[],
  originalGedcomDatabase: GedcomDatabase,
  updatedGedcomDatabase: GedcomDatabase,
  now = new Date(),
): {
  originalGedcomRecord?: GedcomRecord;
  updatedGedcomRecord?: GedcomRecord;
}[] {
  const date = gedcomDateExact(now);
  function hash(gedcomRecord: GedcomRecord) {
    return `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
  }
  const recordMap = new Map<
    string,
    { originalGedcomRecord?: GedcomRecord; updatedGedcomRecord?: GedcomRecord }
  >();
  originalGedcomRecords.forEach((gedcomRecord) => {
    recordMap.set(hash(gedcomRecord), { originalGedcomRecord: gedcomRecord });
  });

  [
    serializeGedcomHeader(generateGedcomHeader(now)),
    ...Object.values(updatedGedcomDatabase.submitters).map((s) =>
      serializeGedcomSubmitter(
        stampDates(originalGedcomDatabase.submitters[s.xref], s, date),
      ),
    ),
    ...Object.values(updatedGedcomDatabase.individuals).map((i) =>
      serializeGedcomIndividual(
        stampDates(originalGedcomDatabase.individuals[i.xref], i, date),
      ),
    ),
    ...Object.values(updatedGedcomDatabase.families).map((f) =>
      serializeGedcomFamily(
        stampDates(originalGedcomDatabase.families[f.xref], f, date),
      ),
    ),
    ...Object.values(updatedGedcomDatabase.sources).map((s) =>
      serializeGedcomSource(
        stampDates(originalGedcomDatabase.sources[s.xref], s, date),
      ),
    ),
    ...Object.values(updatedGedcomDatabase.repositories).map((r) =>
      serializeGedcomRepository(
        stampDates(originalGedcomDatabase.repositories[r.xref], r, date),
      ),
    ),
    ...Object.values(updatedGedcomDatabase.multimedias).map((m) =>
      serializeGedcomMultimedia(
        stampDates(originalGedcomDatabase.multimedias[m.xref], m, date),
      ),
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
  originalGedcomDatabase: GedcomDatabase,
  gedcomDatabase: GedcomDatabase,
  now = new Date(),
): string[] {
  return compareGedcomDatabase(
    originalGedcomRecords,
    originalGedcomDatabase,
    gedcomDatabase,
    now,
  )
    .map(({ updatedGedcomRecord }) => updatedGedcomRecord)
    .filter((r) => r != null)
    .flatMap((r) => serializeGedcomRecordToText(r));
}
