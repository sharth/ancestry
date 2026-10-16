import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  filterTrivialGedcomRecords,
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

  return gedcomSubmitter;
}

export function serializeGedcomSubmitter(
  gedcomSubmitter: GedcomSubmitter,
): GedcomRecord {
  return newGedcomRecord({
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
  });
}
