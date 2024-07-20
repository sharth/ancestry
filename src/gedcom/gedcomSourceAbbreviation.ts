import {ancestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSourceAbbreviation {
  constructor(readonly value: string) {}

  static constructFromGedcom(gedcomRecord: GedcomRecord): GedcomSourceAbbreviation {
    if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);

    return new GedcomSourceAbbreviation(gedcomRecord.value);
  }

  gedcomRecord(): GedcomRecord {
    return new GedcomRecord(1, undefined, 'ABBR', 'SOUR.ABBR', this.value, []);
  }
};
