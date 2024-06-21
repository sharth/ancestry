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
          this.shortTitle = this.parseSourceAbbr(childRecord);
          break;
        case 'TEXT':
          this.text = this.parseSourceText(childRecord);
          break;
        case 'TITL':
          this.fullTitle = this.parseSourceTitle(childRecord);
          break;
        case '_BIBL':
          this.bibl = this.parseSourceBibl(childRecord);
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

  private parseSourceAbbr(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord);
    return gedcomRecord.value;
  }

  private parseSourceBibl(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR._BIBL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord);
    return gedcomRecord.value;
  }

  private parseSourceText( gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.TEXT') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord);
    return gedcomRecord.value;
  }

  private parseSourceTitle( gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.forEach(this.ancestryService.reportUnparsedRecord);
    return gedcomRecord.value;
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
