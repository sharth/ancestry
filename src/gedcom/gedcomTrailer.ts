import type {GedcomRecord} from './gedcomRecord';

export class GedcomTrailer {
  constructor(public gedcomRecord: GedcomRecord) {
    if (gedcomRecord.abstag !== 'TRLR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();
    if (gedcomRecord.children.length != 0) throw new Error();
  }
};
