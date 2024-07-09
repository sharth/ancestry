import type {AncestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSourceRepository {
  constructor(
    readonly repositoryXref: string,
    readonly callNumbers: string[],
    private ancestryService: AncestryService) {}

  static constructFromGedcom(gedcomRecord: GedcomRecord, ancestryService: AncestryService): GedcomSourceRepository {
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

    return new GedcomSourceRepository(repositoryXref, callNumbers, ancestryService);
  }

  gedcomRecord() {
    return new GedcomRecord(
        1, undefined, 'REPO', 'SOUR.REPO', this.repositoryXref,
        this.callNumbers.map((callNumber) => new GedcomRecord(2, undefined, 'CALN', 'SOUR.REPO.CALN', callNumber, [])));
  }

  repository() {
    return this.ancestryService.repository(this.repositoryXref);
  }
}
