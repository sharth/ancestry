import type {AncestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSource {
  constructor(
      private record: GedcomRecord,
      private ancestryService: AncestryService) {
    if (record.abstag !== 'SOUR') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'ABBR':
          if (this.abbr != null) throw new Error();
          this.abbr = new GedcomSourceAbbreviation(childRecord, ancestryService);
          this.childRecords.push(this.abbr);
          break;
        case 'TEXT':
          if (this.text != null) throw new Error();
          this.text = new GedcomSourceText(childRecord, ancestryService);
          this.childRecords.push(this.text);
          break;
        case 'TITL':
          if (this.title != null) throw new Error();
          this.title = new GedcomSourceTitle(childRecord, ancestryService);
          this.childRecords.push(this.title);
          break;
        case 'REPO':
          this.repositories.push(this.parseSourceRepositoryCitation(childRecord));
          break;
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseSourceRepositoryCitation( gedcomRecord: GedcomRecord): {repositoryXref: string, callNumbers: string[]} {
    if (gedcomRecord.abstag !== 'SOUR.REPO') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    const repositoryXref = gedcomRecord.value;
    const callNumbers: string[] = [];

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'CALN':
          callNumbers.push(this.parseSourceRepositoryCallNumber(childRecord));
          break;
        default:
          this.ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }

    return {repositoryXref: repositoryXref, callNumbers: callNumbers};
  }

  private parseSourceRepositoryCallNumber( gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.REPO.CALN') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord);
    return gedcomRecord.value;
  }

  xref: string;
  abbr?: GedcomSourceAbbreviation;
  title?: GedcomSourceTitle;
  text?: GedcomSourceText;

  repositories: {
    repositoryXref: string,
    callNumbers: string[],
  }[] = [];

  childRecords: {gedcomRecord: () => GedcomRecord}[] = [];

  gedcomRecord(): GedcomRecord {
    return new GedcomRecord(
        0, this.xref, 'SOUR', 'SOUR', undefined,
        this.childRecords.map((record) => record.gedcomRecord()));
  }
};

class GedcomSourceTitle {
  constructor(
      gedcomRecord: GedcomRecord,
      ancestryService: AncestryService) {
    if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    this.value = gedcomRecord.value;
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);
  }

  gedcomRecord() {
    return new GedcomRecord(1, undefined, 'TITL', 'SOUR.TITL', this.value, []);
  }

  readonly value: string;
};

class GedcomSourceText {
  constructor(
      gedcomRecord: GedcomRecord,
      ancestryService: AncestryService) {
    if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    this.value = gedcomRecord.value;
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);
  }

  gedcomRecord() {
    return new GedcomRecord(1, undefined, 'TEXT', 'SOUR.TEXT', this.value, []);
  }

  readonly value: string;
};

class GedcomSourceAbbreviation {
  constructor(
      gedcomRecord: GedcomRecord,
      ancestryService: AncestryService) {
    if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    this.value = gedcomRecord.value;
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);
  }

  gedcomRecord() {
    return new GedcomRecord(1, undefined, 'ABBR', 'SOUR.ABBR', this.value, []);
  }

  readonly value: string;
};
