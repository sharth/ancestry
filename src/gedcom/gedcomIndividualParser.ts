import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomCitation } from "./gedcomCitationParser";
import { parseGedcomEvent } from "./gedcomEventParser";
import { GedcomIndividual } from "./gedcomIndividual";
import type { GedcomRecord } from "./gedcomRecord";

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
        parseGedcomIndividualName(gedcomIndividual, childRecord);
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
  gedcomIndividual: GedcomIndividual,
  gedcomRecord: GedcomRecord
): void {
  if (gedcomRecord.abstag !== "INDI.NAME") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  // if (gedcomRecord.value != null) throw new Error();

  const gedcomEvent = parseGedcomEvent(gedcomRecord);
  gedcomIndividual.events.push(gedcomEvent);
  gedcomEvent.value = gedcomRecord.value;

  if (gedcomIndividual.name == null) {
    gedcomIndividual.name = gedcomRecord.value;
    gedcomIndividual.surname = gedcomRecord.value?.match("/(.*)/")?.[1];
  }

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "SOUR":
        gedcomEvent.citations.push(parseGedcomCitation(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
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
