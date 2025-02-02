import type { GedcomDate } from "./gedcomDate";
import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomName } from "./gedcomName";
import type { GedcomSex } from "./gedcomSex";
import type { GedcomRecord } from "./gedcomRecord";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomEvent } from "./gedcomEvent";
import { parseGedcomName } from "./gedcomName";
import { parseGedcomSex } from "./gedcomSex";
import { parseGedcomDate } from "./gedcomDate";
import { serializeGedcomEvent } from "./gedcomEvent";
import { serializeGedcomName } from "./gedcomName";
import { serializeSex } from "./gedcomSex";
import { serializeGedcomDate } from "./gedcomDate";

export interface GedcomIndividual {
  xref: string;
  names: GedcomName[];
  events: GedcomEvent[];
  sex?: GedcomSex;
  familySearchId?: string;
  changeDate?: GedcomDate; // Should only be a GedcomExactDate.
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
        break; // Let's just use the links inside the Family record.
      case "FAMC":
        break; // Let's just use the links inside the Family record.
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
  gedcomRecord: GedcomRecord
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
  gedcomIndividual: GedcomIndividual
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
