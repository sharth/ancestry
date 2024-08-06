import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomSubmitter {
  constructor(public gedcomRecord: GedcomRecord) {
    if (gedcomRecord.abstag !== 'SUBM') throw new Error();
    if (gedcomRecord.xref == null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();

    this.xref = gedcomRecord.xref;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'NAME':
          if (childRecord.xref != null) throw new Error();
          if (childRecord.value == null) throw new Error();
          this.name = childRecord.value;
          break;
        case '_EMAIL':
          if (childRecord.xref != null) throw new Error();
          if (childRecord.value == null) throw new Error();
          this.email = childRecord.value;
          break;
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  readonly xref: string;
  readonly name?: string;
  readonly email?: string;
};
