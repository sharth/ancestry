import {ancestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSourceTitle {
  constructor(readonly value: string) {}

  static constructFromGedcom(gedcomRecord: GedcomRecord) {
    if (gedcomRecord.abstag !== 'SOUR.TITL') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);

    return new GedcomSourceTitle(gedcomRecord.value);
  }

  gedcomRecord() {
    return new GedcomRecord(1, undefined, 'TITL', 'SOUR.TITL', this.value, []);
  }
};
