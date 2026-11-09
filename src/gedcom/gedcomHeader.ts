import { generateGedcomChangeDate } from "./gedcomChangeDate";
import { newGedcomRecord, type GedcomRecord } from "./gedcomRecord";

export interface GedcomHeader {
  record: GedcomRecord;
}

export function parseGedcomHeader(record: GedcomRecord): GedcomHeader {
  if (record.tag !== "HEAD") throw new Error();
  if (record.xref != "") throw new Error();
  if (record.value != "") throw new Error();

  return {
    record,
  };
}

export function serializeGedcomHeader(
  gedcomHeader: GedcomHeader,
): GedcomRecord {
  return gedcomHeader.record;
}

export function generateGedcomHeader(now = new Date()): GedcomHeader {
  return {
    record: newGedcomRecord({
      tag: "HEAD",
      children: [
        newGedcomRecord({
          tag: "GEDC",
          children: [newGedcomRecord({ tag: "VERS", value: "7.0.18" })],
        }),
        newGedcomRecord({
          tag: "SOUR",
          value: "https://github.com/sharth/ancestry",
        }),
        newGedcomRecord({
          tag: "DATE",
          value: generateGedcomChangeDate(now).value,
        }),
      ],
    }),
  };
}
