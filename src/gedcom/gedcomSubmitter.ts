import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  filterTrivialGedcomRecords,
  gedcomRecordsEqual,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomSubmitter {
  xref: string;
  name: string;
  email: string;
  changeDate: GedcomChangeDate;
}

export function newGedcomSubmitter(
  fieldsToUpdate: Partial<GedcomSubmitter> & Pick<GedcomSubmitter, "xref">,
) {
  return {
    name: "",
    email: "",
    changeDate: newGedcomChangeDate(),
    ...fieldsToUpdate,
  };
}

export function parseGedcomSubmitter(
  gedcomRecord: GedcomRecord,
): GedcomSubmitter {
  if (gedcomRecord.tag !== "SUBM") throw new Error();
  if (gedcomRecord.xref == "") throw new Error();
  if (gedcomRecord.value != "") throw new Error();

  const gedcomSubmitter = newGedcomSubmitter({
    xref: gedcomRecord.xref,
  });

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomSubmitter.name = childRecord.value;
        break;
      case "_EMAIL":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomSubmitter.email = childRecord.value;
        break;
      case "CHAN":
        gedcomSubmitter.changeDate = parseGedcomChangeDate(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  // Seed the serialization cache. When the submitter serializes back to
  // exactly the record it was parsed from, cache that record itself, so
  // comparing an unedited submitter against the file is an identity check.
  const serialized = serializeGedcomSubmitter(gedcomSubmitter);
  serializedSubmitters.set(
    gedcomSubmitter,
    gedcomRecordsEqual(serialized, gedcomRecord) ? gedcomRecord : serialized,
  );

  return gedcomSubmitter;
}

// Each submitter's serialization, by object. Submitters are only ever
// changed through immer, which makes a new object for an edited one and
// keeps an unedited one as the same object, so a cached serialization never
// goes stale. See serializeGedcomIndividual.
const serializedSubmitters = new WeakMap<GedcomSubmitter, GedcomRecord>();

export function serializeGedcomSubmitter(
  gedcomSubmitter: GedcomSubmitter,
): GedcomRecord {
  return serializedSubmitters.getOrInsertComputed(gedcomSubmitter, () =>
    newGedcomRecord({
      xref: gedcomSubmitter.xref,
      tag: "SUBM",
      abstag: "SUBM",
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "NAME",
          abstag: "SUBM.NAME",
          value: gedcomSubmitter.name,
        }),
        newGedcomRecord({
          tag: "_EMAIL",
          abstag: "SUBM._EMAIL",
          value: gedcomSubmitter.email,
        }),
        serializeGedcomChangeDate(gedcomSubmitter.changeDate),
      ]),
    }),
  );
}
