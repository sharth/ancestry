import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";
import { GedcomSource } from "./gedcomSource";

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

function parseGedcomSourceRepositoryCitation(gedcomRecord: GedcomRecord) {
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

function parseGedcomSourceMultimediaLink(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.abstag !== "SOUR.OBJE") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  return gedcomRecord.value;
}
