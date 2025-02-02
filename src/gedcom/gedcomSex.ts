import type { GedcomCitation } from "./gedcomCitation";
import type { GedcomRecord } from "./gedcomRecord";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { serializeGedcomCitation } from "./gedcomCitation";
import { parseGedcomCitation } from "./gedcomCitation";

export interface GedcomSex {
  sex: string;
  citations: GedcomCitation[];
}

export function parseGedcomSex(gedcomRecord: GedcomRecord): GedcomSex {
  if (gedcomRecord.abstag !== "INDI.SEX") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomSex: GedcomSex = {
    sex: gedcomRecord.value,
    citations: [],
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "SOUR":
        gedcomSex.citations.push(parseGedcomCitation(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomSex;
}

export function serializeSex(gedcomSex: GedcomSex): GedcomRecord {
  return {
    tag: "SEX",
    abstag: "INDI.SEX",
    value: gedcomSex.sex,
    children: [...gedcomSex.citations.map((c) => serializeGedcomCitation(c))],
  };
}
