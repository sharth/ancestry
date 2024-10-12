import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "../gedcom";
import {
  GedcomEvent,
  GedcomFamily,
  GedcomIndividual,
  GedcomMultimedia,
  GedcomRepository,
  GedcomSource,
  GedcomSubmitter,
  GedcomTrailer,
} from "../gedcom";
import { parseGedcomCitation } from "../gedcom/gedcomCitationParser";

export function parseGedcomTrailer(gedcomRecord: GedcomRecord): GedcomTrailer {
  if (gedcomRecord.abstag !== "TRLR") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();
  if (gedcomRecord.children.length != 0) throw new Error();

  return new GedcomTrailer();
}

export function parseGedcomEvent(record: GedcomRecord): GedcomEvent {
  if (record.xref != null) throw new Error();

  const type =
    new Map([
      ["BAPM", "Baptism"],
      ["BIRT", "Birth"],
      ["BURI", "Burial"],
      ["CENS", "Census"],
      ["DEAT", "Death"],
      ["DIV", "Divorce"],
      ["EDUC", "Education"],
      ["EMIG", "Emigration"],
      ["EVEN", "Event"],
      ["IMMI", "Immigration"],
      ["MARB", "Marriage Banns"],
      ["MARR", "Marriage"],
      ["NAME", "Name"],
      ["NATU", "Naturalization"],
      ["OCCU", "Occupation"],
      ["PROB", "Probate"],
      ["RELI", "Religion"],
      ["RESI", "Residence"],
      ["RETI", "Retirement"],
      ["SEX", "Sex"],
      ["SSN", "Social Security Number"],
      ["WILL", "Will"],
    ]).get(record.tag) ?? record.tag;

  const gedcomEvent = new GedcomEvent(type);
  gedcomEvent.value = record.value;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "_SHAR":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.sharedWithXrefs.push(childRecord.value);
        break;
      case "SOUR":
        gedcomEvent.citations.push(parseGedcomCitation(childRecord));
        break;
      case "DATE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.date = childRecord.value;
        break;
      case "TYPE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.type = childRecord.value;
        break;
      case "ADDR":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.address = childRecord.value;
        break;
      case "PLAC":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.place = childRecord.value;
        break;
      case "CAUS":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomEvent.cause = childRecord.value;
        break;
      case "_SENT":
      case "_SDATE":
      case "_PRIM":
      case "_PROOF":
      case "NOTE":
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomEvent;
}

export function parseGedcomFamily(record: GedcomRecord): GedcomFamily {
  if (record.abstag !== "FAM") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomFamily = new GedcomFamily(record.xref);
  gedcomFamily.gedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "CHIL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.childXrefs.push(childRecord.value);
        break;
      case "HUSB":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.husbandXref = childRecord.value;
        break;
      case "WIFE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.wifeXref = childRecord.value;
        break;
      case "DIV":
      case "EVEN":
      case "MARR":
      case "MARB":
        gedcomFamily.events.push(parseGedcomEvent(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}

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

export function parseGedcomIndividualFamilySearchId(
  gedcomRecord: GedcomRecord
): string {
  if (gedcomRecord.abstag !== "INDI._FSFTID") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRecord.children.forEach(reportUnparsedRecord);
  return gedcomRecord.value;
}

export function parseGedcomIndividualName(
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

export function parseGedcomIndividualSex(
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

export function parseGedcomSource(record: GedcomRecord): GedcomSource {
  if (record.abstag !== "SOUR") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomSource = new GedcomSource(record.xref);
  gedcomSource.canonicalGedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "ABBR":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (gedcomSource.abbr != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.abbr = childRecord.value;
        break;
      case "TEXT":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (gedcomSource.text != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.text = childRecord.value;
        break;
      case "TITL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (gedcomSource.title != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.title = childRecord.value;
        break;
      case "REPO":
        gedcomSource.repositoryCitations.push(
          parseGedcomSourceRepositoryCitation(childRecord)
        );
        break;
      // case 'OBJE':
      //   gedcomSource.multimediaXrefs.push(parseGedcomSourceMultimediaLink(childRecord));
      //   break;
      default:
        gedcomSource.unknownRecords.push(childRecord);
        break;
    }
  }

  return gedcomSource;
}

export function parseGedcomSourceRepositoryCitation(
  gedcomRecord: GedcomRecord
) {
  if (gedcomRecord.abstag !== "SOUR.REPO") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const repositoryXref = gedcomRecord.value;
  const callNumbers: string[] = [];

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "CALN":
        if (childRecord.abstag != "SOUR.REPO.CALN") throw new Error();
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (childRecord.children.length > 0) throw new Error();
        callNumbers.push(childRecord.value);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return { repositoryXref, callNumbers };
}

export function parseGedcomSourceMultimediaLink(
  gedcomRecord: GedcomRecord
): string {
  if (gedcomRecord.abstag !== "SOUR.OBJE") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  return gedcomRecord.value;
}

export function parseGedcomMultimedia(record: GedcomRecord): GedcomMultimedia {
  if (record.abstag !== "OBJE") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomMultimedia = new GedcomMultimedia(record.xref);

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "FILE":
        if (childRecord.xref != null) throw new Error();
        if (gedcomMultimedia.filePath != null)
          throw new Error("Multiple filePaths are not supported.");
        gedcomMultimedia.filePath = childRecord.value;

        for (const grandchildRecord of childRecord.children) {
          switch (grandchildRecord.tag) {
            case "FORM":
              if (grandchildRecord.xref != null) throw new Error();
              if (gedcomMultimedia.mediaType != null)
                throw new Error("Multiple mediaTypes are not allowed");
              gedcomMultimedia.mediaType = grandchildRecord.value;
              grandchildRecord.children.forEach(reportUnparsedRecord);
              break;
            default:
              reportUnparsedRecord(grandchildRecord);
              break;
          }
        }
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomMultimedia;
}

export function parseGedcomSubmitter(
  gedcomRecord: GedcomRecord
): GedcomSubmitter {
  if (gedcomRecord.tag !== "SUBM") throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const gedcomSubmitter = new GedcomSubmitter(gedcomRecord.xref, gedcomRecord);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.name = childRecord.value;
        break;
      case "_EMAIL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.email = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomSubmitter;
}

export function parseGedcomRepository(
  gedcomRecord: GedcomRecord
): GedcomRepository {
  if (gedcomRecord.tag !== "REPO") throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const gedcomRepository = new GedcomRepository(gedcomRecord.xref);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (childRecord.children.length != 0) throw new Error();
        gedcomRepository.name = childRecord.value;
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
  return gedcomRepository;
}
