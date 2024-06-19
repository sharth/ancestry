import type {GedcomRecord} from './gedcomRecord';

export class GedcomCitation {
  constructor(public sourceXref: string) { }
  name?: string;
  obje?: string;
  note?: string;
  text?: string;
  page?: string;
}

export function parseCitation(
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (gedcomRecord: GedcomRecord) => void): GedcomCitation {
  if (gedcomRecord.tag !== 'SOUR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const xref = gedcomRecord.value;
  const gedcomCitation = new GedcomCitation(xref);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case '_TMPLT':
      case '_QUAL':
      case 'QUAY':
        break;
      case 'OBJE':
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.obje = childRecord.value;
        break;
      case 'NAME':
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.name = childRecord.value;
        break;
      case 'NOTE':
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.note = childRecord.value;
        break;
      case 'PAGE':
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.page = childRecord.value;
        break;
      case 'DATA':
        parseCitationData(gedcomCitation, childRecord, reportUnparsedRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}

function parseCitationData(
    gedcomCitation: GedcomCitation,
    gedcomRecord: GedcomRecord,
    reportUnparsedRecord: (gedcomRecord: GedcomRecord) => void): void {
  if (gedcomRecord.tag !== 'DATA') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'TEXT':
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.text ??= '';
        gedcomCitation.text += childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
}

