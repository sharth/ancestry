import type { GedcomDate } from "./gedcomDate";
import type { GedcomIndividual } from "./gedcomIndividual";
import type { GedcomRecord } from "./gedcomRecord";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomEvent } from "./gedcomEventParser";
import { parseGedcomName } from "./gedcomNameParser";
import { parseGedcomSex } from "./gedcomSexParser";
import { parseGedcomDate } from "./gedcomDateParser";

export function parseGedcomIndividual(record: GedcomRecord): GedcomIndividual {
  if (record.abstag !== "INDI") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomIndividual: GedcomIndividual = {
    xref: record.xref,
    names: [],
    events: [],
  };

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
        gedcomIndividual.names.push(parseGedcomName(childRecord));
        break;
      case "SEX":
        if (gedcomIndividual.sex != null) throw new Error();
        gedcomIndividual.sex = parseGedcomSex(childRecord);
        break;
      case "FAMS":
        break; // Let's just use the links inside the Family record.
      case "FAMC":
        break; // Let's just use the links inside the Family record.
      case "_FSFTID":
        gedcomIndividual.familySearchId =
          parseGedcomIndividualFamilySearchId(childRecord);
        break;
      case "CHAN":
        if (gedcomIndividual.changeDate) throw new Error();
        gedcomIndividual.changeDate = parseGedcomChangeDate(childRecord);
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

function parseGedcomChangeDate(gedcomRecord: GedcomRecord): GedcomDate {
  if (gedcomRecord.abstag !== "INDI.CHAN") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  let date: GedcomDate | null = null;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "DATE":
        date = parseGedcomDate(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
    }
  }

  if (date == null) {
    throw new Error();
  }

  return date;
}
