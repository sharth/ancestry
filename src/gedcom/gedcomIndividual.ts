import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomDate } from "./gedcomDate";
import { parseGedcomDate } from "./gedcomDate";
import { serializeGedcomDate } from "./gedcomDate";
import type { GedcomEvent } from "./gedcomEvent";
import { parseGedcomEvent } from "./gedcomEvent";
import { serializeGedcomEvent } from "./gedcomEvent";
import type { GedcomName } from "./gedcomName";
import { parseGedcomName } from "./gedcomName";
import { serializeGedcomName } from "./gedcomName";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSex } from "./gedcomSex";
import { parseGedcomSex } from "./gedcomSex";
import { serializeSex } from "./gedcomSex";

export interface GedcomIndividual {
  xref: string;
  names: GedcomName[];
  events: GedcomEvent[];
  sex?: GedcomSex;
  familySearchId?: string;
  changeDate?: GedcomDate; // Should only be a GedcomExactDate.
  childOfFamilyXref: string[];
  parentOfFamilyXref: string[];
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
    parentOfFamilyXref: [],
    childOfFamilyXref: [],
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
        gedcomIndividual.parentOfFamilyXref.push(childRecord.value);
        break;
      case "FAMC":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomIndividual.childOfFamilyXref.push(childRecord.value);
        break;
      case "_FSFTID":
        gedcomIndividual.familySearchId =
          parseGedcomIndividualFamilySearchId(childRecord);
        break;
      case "CHAN":
        if (gedcomIndividual.changeDate) throw new Error();
        gedcomIndividual.changeDate = parseGedcomChangeDate(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomIndividual;
}

function parseGedcomIndividualFamilySearchId(
  gedcomRecord: GedcomRecord,
): string {
  if (gedcomRecord.abstag !== "INDI._FSFTID") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
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
      gedcomIndividual.familySearchId
        ? serializeFamilySearchId(gedcomIndividual.familySearchId)
        : null,
      gedcomIndividual.changeDate
        ? serializeChangeDate(gedcomIndividual.changeDate)
        : null,
      ...gedcomIndividual.events.map((event) => serializeGedcomEvent(event)),
      ...gedcomIndividual.parentOfFamilyXref.map((xref) => ({
        tag: "FAMS",
        abstag: "",
        value: xref,
        children: [],
      })),
      ...gedcomIndividual.childOfFamilyXref.map((xref) => ({
        tag: "FAMC",
        abstag: "",
        value: xref,
        children: [],
      })),
    ]
      .filter((record) => record != null)
      .filter((record) => record.children.length || record.value),
  };
}

function serializeFamilySearchId(familySearchId: string): GedcomRecord {
  return {
    tag: "_FSFTID",
    abstag: "INDI._FSFTID",
    value: familySearchId,
    children: [],
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
