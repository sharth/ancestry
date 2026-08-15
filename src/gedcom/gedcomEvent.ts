import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomDate,
  serializeGedcomDate,
  serializeGedcomSortDate,
  type GedcomDate,
} from "./gedcomDate";
import {
  parseGedcomNote,
  serializeGedcomNote,
  type GedcomNote,
} from "./gedcomNote";
import {
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  parseGedcomSourceCitation,
  serializeGedcomSourceCitation,
  type GedcomSourceCitation,
} from "./gedcomSourceCitation";

export interface GedcomEventSharedWith {
  xref: string;
  role: string;
}

export interface GedcomEvent {
  tag: string;
  type: string;
  address: string;
  place: string;
  cause: string;
  date: GedcomDate;
  sortDate: GedcomDate;
  value: string;
  citations: GedcomSourceCitation[];
  sharedWith: GedcomEventSharedWith[];
  notes: GedcomNote[];
}

export const gedcomEventTags = new Map([
  ["BAPM", "Baptism"],
  ["BIRT", "Birth"],
  ["BURI", "Burial"],
  ["CENS", "Census"],
  ["DEAT", "Death"],
  ["DIV", "Divorce"],
  ["EDUC", "Education"],
  ["EMIG", "Emigration"],
  ["EVEN", "Event"],
  ["IDNO", "ID Number"],
  ["IMMI", "Immigration"],
  ["MARB", "Marriage Banns"],
  ["MARR", "Marriage"],
  ["NAME", "Name"],
  ["NATU", "Naturalization"],
  ["OCCU", "Occupation"],
  ["PROB", "Probate"],
  ["RELI", "Religion"],
  ["RESI", "Residence"],
  ["RETI", "Retirement"],
  ["SEX", "Sex"],
  ["SSN", "Social Security Number"],
  ["WILL", "Will"],
]);

export function parseGedcomEvent(record: GedcomRecord): GedcomEvent {
  if (!gedcomEventTags.get(record.tag)) throw new Error();
  if (record.xref != "") throw new Error();

  const gedcomEvent = newGedcomEvent({
    tag: record.tag,
    value: record.value,
  });

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "_SHAR":
        gedcomEvent.sharedWith.push(parseGedcomShareEvent(childRecord));
        break;
      case "SOUR":
        gedcomEvent.citations.push(parseGedcomSourceCitation(childRecord));
        break;
      case "DATE":
        gedcomEvent.date = parseGedcomDate(childRecord);
        break;
      case "SDATE":
      case "_SDATE":
        gedcomEvent.sortDate = parseGedcomDate(childRecord);
        break;
      case "TYPE":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.type = childRecord.value;
        break;
      case "ADDR":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.address = childRecord.value;
        break;
      case "PLAC":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.place = childRecord.value;
        break;
      case "CAUS":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.cause = childRecord.value;
        break;
      case "NOTE":
        gedcomEvent.notes.push(parseGedcomNote(childRecord));
        break;
      case "_SENT":
      case "_PRIM":
      case "_PROOF":
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomEvent;
}

function parseGedcomShareEvent(
  gedcomRecord: GedcomRecord,
): GedcomEventSharedWith {
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.tag != "_SHAR") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const result: GedcomEventSharedWith = {
    xref: gedcomRecord.value,
    role: "",
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "ROLE":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length > 0) throw new Error();
        result.role = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
    }
  }

  return result;
}

export function serializeGedcomEvent(gedcomEvent: GedcomEvent): GedcomRecord {
  return newGedcomRecord({
    tag: gedcomEvent.tag,
    value: gedcomEvent.value,
    children: [
      newGedcomRecord({ tag: "TYPE", value: gedcomEvent.type }),
      newGedcomRecord({ tag: "CAUS", value: gedcomEvent.cause }),
      serializeGedcomDate(gedcomEvent.date),
      serializeGedcomSortDate(gedcomEvent.sortDate),
      newGedcomRecord({ tag: "PLAC", value: gedcomEvent.place }),
      newGedcomRecord({ tag: "ADDR", value: gedcomEvent.address }),
      ...gedcomEvent.sharedWith.map((s) => serializeGedcomSharedEvent(s)),
      ...gedcomEvent.notes.map((n) => serializeGedcomNote(n)),
      ...gedcomEvent.citations.map((c) => serializeGedcomSourceCitation(c)),
    ]
      .filter((r) => r != null)
      .filter((r) => r.children.length || r.value),
  });
}

function serializeGedcomSharedEvent(
  sharedWith: GedcomEventSharedWith,
): GedcomRecord {
  return newGedcomRecord({
    tag: "_SHAR",
    value: sharedWith.xref,
    children: filterTrivialGedcomRecords([
      newGedcomRecord({ tag: "ROLE", value: sharedWith.role }),
    ]),
  });
}

export function newGedcomEvent(
  fieldsToUpdate: Partial<GedcomEvent> = {},
): GedcomEvent {
  return {
    tag: "",
    type: "",
    address: "",
    place: "",
    value: "",
    cause: "",
    date: { value: "" },
    sortDate: { value: "" },
    citations: [],
    sharedWith: [],
    notes: [],
    ...fieldsToUpdate,
  };
}
