import type {AncestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomSubmitter {
  constructor(
      private record: GedcomRecord,
      private ancestryService: AncestryService) {
    if (record.abstag !== 'SUBM') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
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

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};
