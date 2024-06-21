import type {GedcomRecord} from './gedcomRecord';

export class GedcomTrailer {
  constructor(
    private record: GedcomRecord) { }

  gedcomRecord() : GedcomRecord {
    return this.record;
  }
};

export function parseTrailer(
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record:GedcomRecord) => void): GedcomTrailer {
  if (gedcomRecord.abstag !== 'TRLR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();
  if (gedcomRecord.children.length != 0) throw new Error();

  return new GedcomTrailer(gedcomRecord);
}
