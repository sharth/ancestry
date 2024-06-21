import {GedcomRecord} from './gedcomRecord';

export class GedcomSource {
  constructor(
    public xref: string,
    private record: GedcomRecord) { }

  shortTitle?: string;
  fullTitle?: string;
  text?: string;
  bibl?: string;

  repositories: {
    repositoryXref: string,
    callNumbers: string[],
  }[] = [];

  gedcomRecord(): GedcomRecord {
    return new GedcomRecord(0, this.xref, 'SOUR', 'SOUR', undefined, [
      ...this.shortTitle ? [new GedcomRecord(1, undefined, 'ABBR', 'SOUR.ABBR', this.shortTitle)] : [],
      ...this.fullTitle ? [new GedcomRecord(1, undefined, 'TITL', 'SOUR.TITL', this.fullTitle)] : [],
      ...this.text ? [new GedcomRecord(1, undefined, 'TEXT', 'SOUR.TEXT', this.text)] : [],
      ...this.bibl ? [new GedcomRecord(1, undefined, '_BIBL', 'SOUR._BIBL', this.bibl)] : [],
      // TODO: Add repository call numbers.
    ]);
  }
};

export function parseSource(
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): GedcomSource {
  if (gedcomRecord.abstag !== 'SOUR') throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const xref = gedcomRecord.xref;
  const gedcomSource = new GedcomSource(xref, gedcomRecord);
  // const gedcomSource = this.gedcomDatabase.source(gedcomRecord.xref);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'ABBR':
        parseSourceAbbr(gedcomSource, childRecord, reportUnparsedRecord);
        break;
      case 'TEXT':
        parseSourceText(gedcomSource, childRecord, reportUnparsedRecord);
        break;
      case 'TITL':
        parseSourceTitle(gedcomSource, childRecord, reportUnparsedRecord);
        break;
      case '_BIBL':
        parseSourceBibl(gedcomSource, childRecord, reportUnparsedRecord);
        break;
      case 'REPO':
        parseSourceRepositoryCitation(gedcomSource, childRecord, reportUnparsedRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomSource;
}

function parseSourceAbbr(
    gedcomSource: GedcomSource,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): void {
  if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomSource.shortTitle = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseSourceBibl(
    gedcomSource: GedcomSource,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): void {
  if (gedcomRecord.abstag !== 'SOUR._BIBL') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomSource.bibl = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseSourceText(
    gedcomSource: GedcomSource,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): void {
  if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomSource.text = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseSourceTitle(
    gedcomSource: GedcomSource,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): void {
  if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomSource.fullTitle = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseSourceRepositoryCitation(
    gedcomSource: GedcomSource,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): void {
  if (gedcomRecord.abstag !== 'SOUR.REPO') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomRepositoryXref = gedcomRecord.value;
  // const gedcomRepository = this.gedcomDatabase.repository(gedcomRecord.value);
  // gedcomRepository.sourceXrefs.push(gedcomSource.xref);

  const gedcomRepositoryCitation = {repositoryXref: gedcomRepositoryXref, callNumbers: []};
  gedcomSource.repositories.push(gedcomRepositoryCitation);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'CALN':
        parseSourceRepositoryCallNumber(gedcomRepositoryCitation, childRecord, reportUnparsedRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

function parseSourceRepositoryCallNumber(
    gedcomRepositoryCitation: { repositoryXref: string, callNumbers: string[] },
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=> void): void {
  if (gedcomRecord.abstag !== 'SOUR.REPO.CALN') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRepositoryCitation.callNumbers.push(gedcomRecord.value);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}
