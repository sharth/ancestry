// A Gedcom Fact is an event or attribute.
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomDate,
  serializeGedcomDate,
  serializeGedcomSortDate,
  type GedcomDate,
} from "./gedcomDate";
import {
  gedcomFamilyAttributes,
  gedcomFamilyEvents,
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
  type GedcomEventMetadata,
} from "./gedcomFactMetadata";
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

export interface GedcomFactSharedWith {
  xref: string;
  role: string;
}

export interface GedcomFact {
  tag: string;
  type: string;
  address: string;
  place: string;
  cause: string;
  date: GedcomDate;
  sortDate: GedcomDate;
  value: string;
  citations: GedcomSourceCitation[];
  sharedWith: GedcomFactSharedWith[];
  notes: GedcomNote[];
}

export function parseGedcomIndividualFact(
  gedcomRecord: GedcomRecord,
): GedcomFact {
  const gedcomEventMetadata =
    gedcomIndividualEvents[gedcomRecord.tag] ??
    gedcomIndividualAttributes[gedcomRecord.tag];
  if (gedcomEventMetadata === undefined) {
    throw new Error();
  }
  return parseGedcomFact(gedcomRecord, gedcomEventMetadata);
}

export function parseGedcomFamilyEvent(gedcomRecord: GedcomRecord): GedcomFact {
  const gedcomEventMetadata =
    gedcomFamilyEvents[gedcomRecord.tag] ??
    gedcomFamilyAttributes[gedcomRecord.tag];
  if (gedcomEventMetadata === undefined) {
    throw new Error();
  }
  return parseGedcomFact(gedcomRecord, gedcomEventMetadata);
}

function parseGedcomFact(
  record: GedcomRecord,
  gedcomEventMetadata: GedcomEventMetadata,
): GedcomFact {
  if (record.tag === "") throw new Error();
  if (record.xref != "") throw new Error();

  const gedcomEvent = newGedcomFact({
    tag: record.tag,
  });

  // If mandatoryValue is set, then the value has some useful meaning.
  // If mandatoryValue is false, then the value is either "Y" or "", and is meaningless.
  if (gedcomEventMetadata.mandatoryValue) {
    gedcomEvent.value = record.value;
  } else if (record.value === "Y" || record.value === "") {
    gedcomEvent.value = "";
  } else {
    throw new Error("Invalid value for event");
  }

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "_SHAR":
        gedcomEvent.sharedWith.push(parseGedcomShareFact(childRecord));
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

function parseGedcomShareFact(
  gedcomRecord: GedcomRecord,
): GedcomFactSharedWith {
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.tag != "_SHAR") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const result: GedcomFactSharedWith = {
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

export function serializeGedcomIndividualFact(
  gedcomEvent: GedcomFact,
): GedcomRecord {
  const gedcomEventMetadata =
    gedcomIndividualEvents[gedcomEvent.tag] ??
    gedcomIndividualAttributes[gedcomEvent.tag];
  if (gedcomEventMetadata === undefined) {
    throw new Error();
  }
  return serializeGedcomFact(gedcomEvent, gedcomEventMetadata);
}

export function serializeGedcomFamilyFact(
  gedcomEvent: GedcomFact,
): GedcomRecord {
  const gedcomEventMetadata =
    gedcomFamilyEvents[gedcomEvent.tag] ??
    gedcomFamilyAttributes[gedcomEvent.tag];
  if (gedcomEventMetadata === undefined) {
    throw new Error();
  }
  return serializeGedcomFact(gedcomEvent, gedcomEventMetadata);
}

function serializeGedcomFact(
  gedcomEvent: GedcomFact,
  gedcomEventMetadata: GedcomEventMetadata,
): GedcomRecord {
  const value = gedcomEventMetadata.mandatoryValue
    ? gedcomEvent.value
    : gedcomEvent.place || gedcomEvent.date.value
      ? ""
      : "Y";
  return newGedcomRecord({
    tag: gedcomEvent.tag,
    value: value,
    children: [
      newGedcomRecord({ tag: "TYPE", value: gedcomEvent.type }),
      newGedcomRecord({ tag: "CAUS", value: gedcomEvent.cause }),
      serializeGedcomDate(gedcomEvent.date),
      serializeGedcomSortDate(gedcomEvent.sortDate),
      newGedcomRecord({ tag: "PLAC", value: gedcomEvent.place }),
      newGedcomRecord({ tag: "ADDR", value: gedcomEvent.address }),
      ...gedcomEvent.sharedWith.map((s) => serializeGedcomSharedFact(s)),
      ...gedcomEvent.notes.map((n) => serializeGedcomNote(n)),
      ...gedcomEvent.citations.map((c) => serializeGedcomSourceCitation(c)),
    ]
      .filter((r) => r != null)
      .filter((r) => r.children.length || r.value),
  });
}

function serializeGedcomSharedFact(
  sharedWith: GedcomFactSharedWith,
): GedcomRecord {
  return newGedcomRecord({
    tag: "_SHAR",
    value: sharedWith.xref,
    children: filterTrivialGedcomRecords([
      newGedcomRecord({ tag: "ROLE", value: sharedWith.role }),
    ]),
  });
}

export function newGedcomFact(
  fieldsToUpdate: Partial<GedcomFact> = {},
): GedcomFact {
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
