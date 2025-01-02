import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomCitation } from "./gedcomCitationParser";
import { parseGedcomEvent } from "./gedcomEventParser";
import { GedcomIndividual } from "./gedcomIndividual";
import type { GedcomCitation } from "./gedcomCitation";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomIndividualName } from "./gedcomIndividual";

export function parseGedcomIndividual(record: GedcomRecord): GedcomIndividual {
  if (record.abstag !== "INDI") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomIndividual = new GedcomIndividual(record.xref);
  gedcomIndividual.gedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "BAPM":
      case "BIRT":
      case "BURI":
      case "CENS":
      case "DEAT":
      case "EDUC":
      case "EMIG":
      case "EVEN":
      case "IMMI":
      case "MARB":
      case "MARR":
      case "NATU":
      case "OCCU":
      case "PROB":
      case "RELI":
      case "RESI":
      case "RETI":
      case "WILL":
      case "DIV":
      case "SSN":
        gedcomIndividual.events.push(parseGedcomEvent(childRecord));
        break;
      case "NAME":
        gedcomIndividual.names.push(parseGedcomIndividualName(childRecord));
        break;
      case "SEX":
        parseGedcomIndividualSex(gedcomIndividual, childRecord);
        break;
      case "FAMS":
        break; // Let's just use the links inside the Family record.
      case "FAMC":
        break; // Let's just use the links inside the Family record.
      case "_FSFTID":
        gedcomIndividual.familySearchId =
          parseGedcomIndividualFamilySearchId(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomIndividual;
}

function parseGedcomIndividualFamilySearchId(
  gedcomRecord: GedcomRecord
): string {
  if (gedcomRecord.abstag !== "INDI._FSFTID") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

function parseGedcomIndividualName(
  gedcomRecord: GedcomRecord
): GedcomIndividualName {
  if (gedcomRecord.abstag !== "INDI.NAME") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  // if (gedcomRecord.value != null) throw new Error();

  const namePrefixes: string[] = [];
  const givenNames: string[] = [];
  const nickNames: string[] = [];
  const surnamePrefixes: string[] = [];
  const surnames: string[] = [];
  const nameSuffixes: string[] = [];
  const citations: GedcomCitation[] = [];

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NPFX":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        namePrefixes.push(childRecord.value);
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
        nameSuffixes.push(childRecord.value);
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
    namePrefixes.length == 0 &&
    givenNames.length == 0 &&
    nickNames.length == 0 &&
    surnamePrefixes.length == 0 &&
    surnames.length == 0 &&
    nameSuffixes.length == 0
  ) {
    const match = new RegExp(`(.*)/(.*)/(.*)`).exec(gedcomRecord.value);
    if (match) {
      if (match[1]) givenNames.push(match[1]);
      if (match[2]) surnames.push(match[2]);
      if (match[3]) nameSuffixes.push(match[3]);
    } else {
      givenNames.push(gedcomRecord.value);
    }
  }

  return {
    namePrefix: namePrefixes.join(" ") || undefined,
    givenName: givenNames.join(" ") || undefined,
    nickName: nickNames.join(" ") || undefined,
    surnamePrefix: surnamePrefixes.join(" ") || undefined,
    surname: surnames.join(" ") || undefined,
    nameSuffix: nameSuffixes.join(" ") || undefined,
    citations,
  };
}

function parseGedcomIndividualSex(
  gedcomIndividual: GedcomIndividual,
  gedcomRecord: GedcomRecord
) {
  if (gedcomRecord.abstag !== "INDI.SEX") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomEvent = parseGedcomEvent(gedcomRecord);
  gedcomIndividual.events.push(gedcomEvent);
  gedcomEvent.value = gedcomRecord.value;

  if (gedcomIndividual.sex == null) {
    switch (gedcomRecord.value) {
      case "M":
        gedcomIndividual.sex = "Male";
        break;
      case "F":
        gedcomIndividual.sex = "Female";
        break;
    }
  }

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}
