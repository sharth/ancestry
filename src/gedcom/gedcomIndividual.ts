import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomDate } from "./gedcomDate";
import { parseGedcomDate, serializeGedcomDate } from "./gedcomDate";
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
  changeDate?: GedcomDate; // Should only be a GedcomExactDate.
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
    .filter((part) => part != null)
    .join(" ");
}

export function surname(gedcomIndividual: GedcomIndividual): string {
  const gedcomName = gedcomIndividual.names.at(0);
  return gedcomName?.surname ?? "";
}

export function parseGedcomIndividual(record: GedcomRecord): GedcomIndividual {
  if (record.abstag !== "INDI") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

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
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomIndividual.parentOfFamilyXrefs.push(childRecord.value);
        break;
      case "FAMC":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
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

function parseGedcomChangeDate(gedcomRecord: GedcomRecord): GedcomDate {
  if (gedcomRecord.abstag !== "INDI.CHAN") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  let date: GedcomDate | null = null;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "DATE":
        date = parseGedcomDate(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
    }
  }

  if (date == null) {
    throw new Error();
  }

  return date;
}

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual,
): GedcomRecord {
  return {
    xref: gedcomIndividual.xref,
    tag: "INDI",
    abstag: "INDI",
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
        ? serializeChangeDate(gedcomIndividual.changeDate)
        : null,
      ...gedcomIndividual.unknownRecords.filter(
        (record) => record.tag == "SOUR",
      ),
      ...gedcomIndividual.events.map((event) => serializeGedcomEvent(event)),
      ...gedcomIndividual.parentOfFamilyXrefs.map((xref) => ({
        tag: "FAMS",
        abstag: "",
        value: xref,
        children: [],
      })),
      ...gedcomIndividual.childOfFamilyXrefs.map((xref) => ({
        tag: "FAMC",
        abstag: "",
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

function serializeChangeDate(date: GedcomDate): GedcomRecord {
  return {
    tag: "CHAN",
    abstag: "INDI.CHAN",
    value: undefined,
    children: [serializeGedcomDate(date)],
  };
}
