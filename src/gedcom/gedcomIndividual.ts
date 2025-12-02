import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomChangeDate } from "./gedcomChangeDate";
import {
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
} from "./gedcomChangeDate";
import type { GedcomEvent } from "./gedcomEvent";
import { parseGedcomEvent, serializeGedcomEvent } from "./gedcomEvent";
import type { GedcomName } from "./gedcomName";
import { parseGedcomName, serializeGedcomName } from "./gedcomName";
import {
  type GedcomNote,
  parseGedcomNote,
  serializeGedcomNote,
} from "./gedcomNote";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSex } from "./gedcomSex";
import { parseGedcomSex, serializeSex } from "./gedcomSex";

export interface GedcomIndividual {
  xref: string;
  names: GedcomName[];
  events: GedcomEvent[];
  sex?: GedcomSex;
  changeDate?: GedcomChangeDate;
  childOfFamilyXrefs: string[];
  parentOfFamilyXrefs: string[];
  notes: GedcomNote[];
  unknownRecords: GedcomRecord[];
}

export function fullname(gedcomIndividual: GedcomIndividual): string {
  const gedcomName = gedcomIndividual.names.at(0);
  if (gedcomName == null) return "";
  return [
    gedcomName.prefix,
    gedcomName.givenName,
    gedcomName.nickName,
    gedcomName.surnamePrefix,
    gedcomName.surname,
    gedcomName.suffix,
  ]
    .filter((part) => part != "")
    .join(" ");
}

export function surname(gedcomIndividual: GedcomIndividual): string {
  const gedcomName = gedcomIndividual.names.at(0);
  return gedcomName?.surname ?? "";
}

export function parseGedcomIndividual(record: GedcomRecord): GedcomIndividual {
  if (record.abstag !== "INDI") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomIndividual: GedcomIndividual = {
    xref: record.xref,
    names: [],
    events: [],
    parentOfFamilyXrefs: [],
    childOfFamilyXrefs: [],
    unknownRecords: [],
    notes: [],
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "BAPM":
      case "BIRT":
      case "BURI":
      case "CENS":
      case "DEAT":
      case "EDUC":
      case "EMIG":
      case "EVEN":
      case "IDNO":
      case "IMMI":
      case "MARB":
      case "MARR":
      case "NATU":
      case "OCCU":
      case "PROB":
      case "RELI":
      case "RESI":
      case "RETI":
      case "WILL":
      case "DIV":
      case "SSN":
        gedcomIndividual.events.push(parseGedcomEvent(childRecord));
        break;
      case "NAME":
        gedcomIndividual.names.push(parseGedcomName(childRecord));
        break;
      case "SEX":
        if (gedcomIndividual.sex != null) throw new Error();
        gedcomIndividual.sex = parseGedcomSex(childRecord);
        break;
      case "FAMS":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomIndividual.parentOfFamilyXrefs.push(childRecord.value);
        break;
      case "FAMC":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomIndividual.childOfFamilyXrefs.push(childRecord.value);
        break;
      case "CHAN":
        if (gedcomIndividual.changeDate) throw new Error();
        gedcomIndividual.changeDate = parseGedcomChangeDate(childRecord);
        break;
      case "NOTE":
        gedcomIndividual.notes.push(parseGedcomNote(childRecord));
        break;
      default:
        gedcomIndividual.unknownRecords.push(childRecord);
        break;
    }
  }

  return gedcomIndividual;
}

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual,
): GedcomRecord {
  return {
    xref: gedcomIndividual.xref,
    tag: "INDI",
    abstag: "INDI",
    value: "",
    children: [
      ...gedcomIndividual.names.map((name) => serializeGedcomName(name)),
      gedcomIndividual.sex ? serializeSex(gedcomIndividual.sex) : null,
      ...gedcomIndividual.unknownRecords.filter(
        (record) => record.tag == "_UID",
      ),
      ...gedcomIndividual.unknownRecords.filter(
        (record) => record.tag == "_FSFTID",
      ),
      ...gedcomIndividual.unknownRecords.filter(
        (record) => record.tag == "_AMTID",
      ),
      gedcomIndividual.changeDate
        ? serializeGedcomChangeDate(gedcomIndividual.changeDate)
        : null,
      ...gedcomIndividual.unknownRecords.filter(
        (record) => record.tag == "SOUR",
      ),
      ...gedcomIndividual.events.map((event) => serializeGedcomEvent(event)),
      ...gedcomIndividual.parentOfFamilyXrefs.map((xref) => ({
        tag: "FAMS",
        abstag: "",
        xref: "",
        value: xref,
        children: [],
      })),
      ...gedcomIndividual.childOfFamilyXrefs.map((xref) => ({
        tag: "FAMC",
        abstag: "",
        xref: "",
        value: xref,
        children: [],
      })),
      ...gedcomIndividual.notes.map((gedcomNote) =>
        serializeGedcomNote(gedcomNote),
      ),
      ...gedcomIndividual.unknownRecords.filter(
        (record) =>
          record.tag != "_UID" &&
          record.tag != "_FSFTID" &&
          record.tag != "_AMTID" &&
          record.tag != "SOUR",
      ),
    ].filter((record) => record != null),
  };
}
