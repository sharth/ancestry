import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomRepository {
  constructor(public gedcomRecord: GedcomRecord) {
    if (gedcomRecord.abstag !== 'REPO') throw new Error();
    if (gedcomRecord.xref == null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();

    this.xref = gedcomRecord.xref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'NAME':
          if (childRecord.abstag !== 'REPO.NAME') throw new Error();
          if (childRecord.xref != null) throw new Error();
          if (childRecord.value == null) throw new Error();
          if (childRecord.children.length != 0) throw new Error();
          this.name = childRecord.value;
          break;

        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  xref: string;
  name?: string;
};
