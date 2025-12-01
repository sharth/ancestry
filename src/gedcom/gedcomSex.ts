import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSourceCitation } from "./gedcomSourceCitation";
import { serializeGedcomSourceCitation } from "./gedcomSourceCitation";
import { parseGedcomSourceCitation } from "./gedcomSourceCitation";

export interface GedcomSex {
  sex: string;
  citations: GedcomSourceCitation[];
}

export function parseGedcomSex(gedcomRecord: GedcomRecord): GedcomSex {
  if (gedcomRecord.abstag !== "INDI.SEX") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const gedcomSex: GedcomSex = {
    sex: gedcomRecord.value,
    citations: [],
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "SOUR":
        gedcomSex.citations.push(parseGedcomSourceCitation(childRecord));
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
    xref: "",
    value: gedcomSex.sex,
    children: [
      ...gedcomSex.citations.map((c) => serializeGedcomSourceCitation(c)),
    ],
  };
}
