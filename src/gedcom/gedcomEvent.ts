import type { GedcomCitation } from "./gedcomCitation";
import type { GedcomDate } from "./gedcomDate";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomCitation, serializeGedcomCitation } from "./gedcomCitation";
import { parseGedcomDate } from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";
import { serializeGedcomDate, serializeGedcomSortDate } from "./gedcomDate";

export interface GedcomEvent {
  tag: string;
  type?: string;
  address?: string;
  place?: string;
  cause?: string;
  date?: GedcomDate;
  sortDate?: GedcomDate;
  value?: string;
  citations: GedcomCitation[];
  sharedWith: {
    xref: string;
    role?: string;
  }[];
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
  if (record.xref != null) throw new Error();

  const gedcomEvent: GedcomEvent = {
    tag: record.tag,
    value: record.value,
    citations: [],
    sharedWith: [],
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "_SHAR":
        gedcomEvent.sharedWith.push(parseGedcomShareEvent(childRecord));
        break;
      case "SOUR":
        gedcomEvent.citations.push(parseGedcomCitation(childRecord));
        break;
      case "DATE":
        if (gedcomEvent.date != null) throw new Error();
        gedcomEvent.date = parseGedcomDate(childRecord);
        break;
      case "SDATE":
      case "_SDATE":
        if (gedcomEvent.sortDate != null) throw new Error();
        gedcomEvent.sortDate = parseGedcomDate(childRecord);
        break;
      case "TYPE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.type = childRecord.value;
        break;
      case "ADDR":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.address = childRecord.value;
        break;
      case "PLAC":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.place = childRecord.value;
        break;
      case "CAUS":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.cause = childRecord.value;
        break;
      case "_SENT":
      case "_PRIM":
      case "_PROOF":
      case "NOTE":
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomEvent;
}

function parseGedcomShareEvent(gedcomRecord: GedcomRecord): {
  xref: string;
  role?: string;
} {
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.tag != "_SHAR") throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const result: { xref: string; role?: string } = {
    xref: gedcomRecord.value,
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "ROLE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
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
  return {
    tag: gedcomEvent.tag,
    abstag: "",
    value: gedcomEvent.value,
    children: [
      { tag: "TYPE", abstag: "", value: gedcomEvent.type, children: [] },
      gedcomEvent.date ? serializeGedcomDate(gedcomEvent.date) : null,
      gedcomEvent.sortDate
        ? serializeGedcomSortDate(gedcomEvent.sortDate)
        : null,
      { tag: "PLAC", abstag: "", value: gedcomEvent.place, children: [] },
      { tag: "ADDR", abstag: "", value: gedcomEvent.address, children: [] },
      { tag: "CAUS", abstag: "", value: gedcomEvent.cause, children: [] },
      ...gedcomEvent.sharedWith.map((s) => serializeGedcomSharedEvent(s)),
      ...gedcomEvent.citations.map((c) => serializeGedcomCitation(c)),
    ]
      .filter((r) => r != null)
      .filter((r) => r.children.length || r.value),
  };
}

function serializeGedcomSharedEvent(sharedWith: {
  xref: string;
  role?: string;
}) {
  return {
    tag: "_SHAR",
    abstag: "",
    value: sharedWith.xref,
    children: [
      { tag: "ROLE", abstag: "", value: sharedWith.role, children: [] },
    ].filter((r) => r.children.length || r.value),
  };
}
