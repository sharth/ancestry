import type {GedcomRecord} from './gedcomRecord';

export class GedcomHeader {
  constructor(public record: GedcomRecord) { }
};

export function parseHeader(
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record:GedcomRecord) => void): GedcomHeader {
  if (gedcomRecord.abstag !== 'HEAD') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  return new GedcomHeader(gedcomRecord);
}

