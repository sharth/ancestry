import type {AncestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSourceTitle {
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
