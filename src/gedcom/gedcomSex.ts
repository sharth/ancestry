import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSourceCitation } from "./gedcomSourceCitation";
import { serializeGedcomSourceCitation } from "./gedcomSourceCitation";
import { parseGedcomSourceCitation } from "./gedcomSourceCitation";

export interface GedcomSex {
  sex: string;
  citations: GedcomSourceCitation[];
}

export function newGedcomSex(): GedcomSex {
  return {
    sex: "",
    citations: [],
  };
}

export function parseGedcomSex(gedcomRecord: GedcomRecord): GedcomSex {
  if (gedcomRecord.abstag !== "INDI.SEX") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const gedcomSex = newGedcomSex();
  gedcomSex.sex = gedcomRecord.value;

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

export function serializeGedcomSex(gedcomSex: GedcomSex): GedcomRecord | null {
  if (gedcomSex.sex == "" && gedcomSex.citations.length === 0) {
    return null;
  }
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
