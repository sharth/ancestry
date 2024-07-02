import type {AncestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';

export class GedcomSourceAbbreviation {
  constructor(readonly value: string, private ancestryService: AncestryService) {}

  static constructFromGedcom(gedcomRecord: GedcomRecord, ancestryService: AncestryService): GedcomSourceAbbreviation {
    if (gedcomRecord.abstag !== 'SOUR.ABBR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();
    gedcomRecord.children.forEach(ancestryService.reportUnparsedRecord);

    return new GedcomSourceAbbreviation(gedcomRecord.value, ancestryService);
  }

  gedcomRecord(): GedcomRecord {
    return new GedcomRecord(1, undefined, 'ABBR', 'SOUR.ABBR', this.value, []);
  }
};
