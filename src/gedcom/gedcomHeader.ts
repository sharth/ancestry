import { monthNames } from "./gedcomDate";
import { newGedcomRecord, type GedcomRecord } from "./gedcomRecord";

export interface GedcomHeader {
  record: GedcomRecord;
}

export function parseGedcomHeader(record: GedcomRecord): GedcomHeader {
  if (record.abstag !== "HEAD") throw new Error();
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
  const day = now.getDate();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return {
    record: newGedcomRecord({
      tag: "HEAD",
      children: [
        newGedcomRecord({
          tag: "GEDC",
          children: [newGedcomRecord({ tag: "VERS", value: "7.0.14" })],
        }),
        newGedcomRecord({
          tag: "SOUR",
          value: "https://github.com/sharth/ancestry",
        }),
        newGedcomRecord({
          tag: "DATE",
          value: `${day} ${month} ${year}`,
        }),
      ],
    }),
  };
}
