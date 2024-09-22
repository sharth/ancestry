import type {GedcomRecord} from './gedcomRecord';

export class GedcomHeader {
  constructor(public record: GedcomRecord) {
    if (record.abstag !== 'HEAD') throw new Error();
    if (record.xref != null) throw new Error();
    if (record.value != null) throw new Error();
  }
};

