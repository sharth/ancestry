import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { monthNames } from "./gedcomDate";
import {
  parseGedcomFamily,
  serializeGedcomFamily,
  type GedcomFamily,
} from "./gedcomFamily";
import {
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

export function compareGedcomDatabase(
  originalGedcomRecords: GedcomRecord[],
  updatedGedcomDatabase: GedcomDatabase,
): {
  originalGedcomRecord?: GedcomRecord;
  updatedGedcomRecord?: GedcomRecord;
}[] {
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
    serializeGedcomHeader(generateGedcomHeader()),
    ...Object.values(updatedGedcomDatabase.submitters).map((s) =>
      serializeGedcomSubmitter(s),
    ),
    ...Object.values(updatedGedcomDatabase.individuals).map((i) =>
      serializeGedcomIndividual(i),
    ),
    ...Object.values(updatedGedcomDatabase.families).map((f) =>
      serializeGedcomFamily(f),
    ),
    ...Object.values(updatedGedcomDatabase.sources).map((s) =>
      serializeGedcomSource(s),
    ),
    ...Object.values(updatedGedcomDatabase.repositories).map((r) =>
      serializeGedcomRepository(r),
    ),
    ...Object.values(updatedGedcomDatabase.multimedias).map((m) =>
      serializeGedcomMultimedia(m),
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
): string[] {
  return compareGedcomDatabase(originalGedcomRecords, gedcomDatabase)
    .map(({ updatedGedcomRecord }) => updatedGedcomRecord)
    .filter((r) => r != null)
    .flatMap((r) => serializeGedcomRecordToText(r));
}

function generateGedcomHeader(now = new Date()): GedcomHeader {
  const day = now.getDate();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return {
    record: newGedcomRecord({
      tag: "HEAD",
      children: [
        newGedcomRecord({
          tag: "GEDC",
          children: [newGedcomRecord({ tag: "VERS", value: "7.0.14" })],
        }),
        newGedcomRecord({
          tag: "SOUR",
          value: "https://github.com/sharth/ancestry",
        }),
        newGedcomRecord({
          tag: "DATE",
          value: `${day} ${month} ${year}`,
        }),
      ],
    }),
  };
}
