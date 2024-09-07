import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';
import {GedcomSource} from './gedcomSource';

export function constructSourceFromGedcomRecord(record: GedcomRecord): GedcomSource {
  if (record.abstag !== 'SOUR') throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomSource = new GedcomSource(record.xref);
  gedcomSource.canonicalGedcomRecord = record;

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case 'ABBR':
        if (gedcomSource.abbr != null) throw new Error();
        gedcomSource.abbr = constructSourceAbbreviationFromGedcom(childRecord);
        break;
      case 'TEXT':
        if (gedcomSource.text != null) throw new Error();
        gedcomSource.text = constructSourceTextFromGedcom(childRecord);
        break;
      case 'TITL':
        if (gedcomSource.title != null) throw new Error();
        gedcomSource.title = constructSourceTitleFromGedcom(childRecord);
        break;
      case 'REPO':
        gedcomSource.repositoryCitations.push(
            constructSourceRepositoryCitationFromGedcom(childRecord));
        break;
      // case 'OBJE':
      //   gedcomSource.multimediaXrefs.push(constructMultimediaLink(childRecord));
      //   break;
      default:
        gedcomSource.unknownRecords.push(childRecord);
        break;
    }
  }

  return gedcomSource;
}

function constructSourceAbbreviationFromGedcom(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();
  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));

  return gedcomRecord.value;
}

function constructSourceTitleFromGedcom(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();
  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));

  return gedcomRecord.value;
}

function constructSourceTextFromGedcom(gedcomRecord: GedcomRecord) {
  if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();
  gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));

  return gedcomRecord.value;
}

function constructSourceRepositoryCitationFromGedcom(gedcomRecord: GedcomRecord) {
  if (gedcomRecord.abstag !== 'SOUR.REPO') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const repositoryXref = gedcomRecord.value;
  const callNumbers: string[] = [];

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'CALN':
        if (childRecord.abstag != 'SOUR.REPO.CALN') throw new Error();
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (childRecord.children.length > 0) throw new Error();
        callNumbers.push(childRecord.value);
        break;
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }

  return {repositoryXref, callNumbers};
}

function constructMultimediaLink(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.abstag !== 'SOUR.OBJE') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  return gedcomRecord.value;
}