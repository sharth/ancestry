import type {AncestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomRepository {
  constructor(
      private record: GedcomRecord,
      private ancestryService: AncestryService) {
    if (record.abstag !== 'REPO') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'NAME':
          this.parseRepositoryName(childRecord);
          break;
        default:
          this.ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseRepositoryName(gedcomRecord: GedcomRecord): string {
    if (gedcomRecord.abstag !== 'REPO.NAME') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    gedcomRecord.children.map((childRecord) => this.ancestryService.reportUnparsedRecord(childRecord));
    return gedcomRecord.value;
  }

  xref: string;
  name?: string;

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};
