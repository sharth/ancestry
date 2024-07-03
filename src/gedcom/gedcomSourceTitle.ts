import type {AncestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSourceTitle {
  constructor(readonly value: string, private ancestryService: AncestryService) {}

  static constructFromGedcom(gedcomRecord: GedcomRecord, ancestryService: AncestryService) {
    if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);

    return new GedcomSourceTitle(gedcomRecord.value, ancestryService);
  }

  gedcomRecord() {
    return new GedcomRecord(1, undefined, 'TITL', 'SOUR.TITL', this.value, []);
  }
};
