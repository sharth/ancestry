import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomCitation } from "./gedcomCitationParser";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSex } from "./gedcomSex";

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
