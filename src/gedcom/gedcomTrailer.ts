import type {GedcomRecord} from './gedcomRecord';

export class GedcomTrailer {
  constructor(
    private record: GedcomRecord) {
    if (record.abstag !== 'TRLR') throw new Error();
    if (record.xref != null) throw new Error();
    if (record.value != null) throw new Error();
    if (record.children.length != 0) throw new Error();
  }

  gedcomRecord() : GedcomRecord {
    return this.record;
  }
};
