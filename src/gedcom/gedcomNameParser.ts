import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomCitation } from "./gedcomCitation";
import { parseGedcomCitation } from "./gedcomCitationParser";
import type { GedcomName } from "./gedcomName";
import type { GedcomRecord } from "./gedcomRecord";

export function parseGedcomName(gedcomRecord: GedcomRecord): GedcomName {
  if (gedcomRecord.abstag !== "INDI.NAME") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();

  const prefixes: string[] = [];
  const givenNames: string[] = [];
  const nickNames: string[] = [];
  const surnamePrefixes: string[] = [];
  const surnames: string[] = [];
  const suffixes: string[] = [];
  const citations: GedcomCitation[] = [];

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NPFX":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        prefixes.push(childRecord.value);
        break;
      case "GIVN":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        givenNames.push(childRecord.value);
        break;
      case "NICK":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        nickNames.push(childRecord.value);
        break;
      case "SPFX":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        surnamePrefixes.push(childRecord.value);
        break;
      case "SURN":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        surnames.push(childRecord.value);
        break;
      case "NSFX":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        suffixes.push(childRecord.value);
        break;
      case "SOUR":
        citations.push(parseGedcomCitation(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  if (
    gedcomRecord.value &&
    prefixes.length == 0 &&
    givenNames.length == 0 &&
    nickNames.length == 0 &&
    surnamePrefixes.length == 0 &&
    surnames.length == 0 &&
    suffixes.length == 0
  ) {
    const match = new RegExp(`(.*)/(.*)/(.*)`).exec(gedcomRecord.value);
    if (match) {
      if (match[1]) givenNames.push(match[1]);
      if (match[2]) surnames.push(match[2]);
      if (match[3]) suffixes.push(match[3]);
    } else {
      givenNames.push(gedcomRecord.value);
    }
  }

  return {
    prefix: prefixes.join(" ") || undefined,
    givenName: givenNames.join(" ") || undefined,
    nickName: nickNames.join(" ") || undefined,
    surnamePrefix: surnamePrefixes.join(" ") || undefined,
    surname: surnames.join(" ") || undefined,
    suffix: suffixes.join(" ") || undefined,
    citations,
  };
}
