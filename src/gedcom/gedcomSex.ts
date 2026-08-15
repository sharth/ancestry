import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  filterTrivialGedcomRecord,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  parseGedcomSourceCitation,
  serializeGedcomSourceCitation,
  type GedcomSourceCitation,
} from "./gedcomSourceCitation";

export interface GedcomSex {
  sex: string;
  citations: GedcomSourceCitation[];
}

export function newGedcomSex(
  fieldsToUpdate: Partial<GedcomSex> = {},
): GedcomSex {
  return {
    sex: "",
    citations: [],
    ...fieldsToUpdate,
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
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "SEX",
      abstag: "INDI.SEX",
      value: gedcomSex.sex,
      children: [
        ...gedcomSex.citations.map((c) => serializeGedcomSourceCitation(c)),
      ],
    }),
  );
}
