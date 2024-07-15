import type {GedcomRecord} from './gedcomRecord';

export class GedcomHeader {
  constructor(private record: GedcomRecord) {
    if (record.abstag !== 'HEAD') throw new Error();
    if (record.xref != null) throw new Error();
    if (record.value != null) throw new Error();
  }

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};

