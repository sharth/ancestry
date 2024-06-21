import type {GedcomRecord} from './gedcomRecord';

export class GedcomRepository {
  constructor(
    public xref: string,
    private record: GedcomRecord) { }

  name?: string;
  sourceXrefs: string[] = [];

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};

export function parseRepository(
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=>void): GedcomRepository {
  if (gedcomRecord.abstag !== 'REPO') throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const xref = gedcomRecord.xref;
  const gedcomRepository = new GedcomRepository(xref, gedcomRecord);
  // const gedcomRepository: GedcomRepository = this.gedcomDatabase.repository(gedcomRecord.xref);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'NAME': parseRepositoryName(gedcomRepository, childRecord, reportUnparsedRecord); break;
      default: reportUnparsedRecord(childRecord); break;
    }
  }

  return gedcomRepository;
}

function parseRepositoryName(
    gedcomRepository: GedcomRepository,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (record: GedcomRecord)=>void): void {
  if (gedcomRecord.abstag !== 'REPO.NAME') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  gedcomRepository.name = gedcomRecord.value;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}
