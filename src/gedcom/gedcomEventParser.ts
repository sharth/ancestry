import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomCitation } from "./gedcomCitationParser";
import { gedcomEventTags, type GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export function parseGedcomEvent(record: GedcomRecord): GedcomEvent {
  if (!gedcomEventTags.get(record.tag)) throw new Error();
  if (record.xref != null) throw new Error();

  const gedcomEvent: GedcomEvent = {
    tag: record.tag,
    value: record.value,
    citations: [],
    sharedWithXrefs: [],
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "_SHAR":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.sharedWithXrefs.push(childRecord.value);
        break;
      case "SOUR":
        gedcomEvent.citations.push(parseGedcomCitation(childRecord));
        break;
      case "DATE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.date = childRecord.value;
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
      case "_SDATE":
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
