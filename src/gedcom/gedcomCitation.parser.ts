import {ancestryService} from '../app/ancestry.service';
import {GedcomCitation} from './gedcomCitation';
import type {GedcomRecord} from './gedcomRecord';

export function parseGedcomCitationFromGedcomRecord(gedcomRecord: GedcomRecord): GedcomCitation {
  if (gedcomRecord.tag !== 'SOUR') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomCitation = new GedcomCitation(gedcomRecord.value);
  gedcomCitation.gedcomRecord = gedcomRecord;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case '_TMPLT':
      case '_QUAL':
      case 'QUAY':
        break;
      case 'OBJE':
        childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
        gedcomCitation.obje = childRecord.value;
        break;
      case 'NAME':
        childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
        gedcomCitation.name = childRecord.value;
        break;
      case 'NOTE':
        childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
        gedcomCitation.note = childRecord.value;
        break;
      case 'PAGE':
        childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
        gedcomCitation.page = childRecord.value;
        break;
      case 'DATA':
        gedcomCitation.text = parseCitationData(childRecord);
        break;
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}

function parseCitationData(gedcomRecord: GedcomRecord ): string {
  if (gedcomRecord.tag !== 'DATA') throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  let text = '';

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'TEXT':
        if (childRecord.value)
          text += childRecord.value;
        childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
        break;
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }
  return text;
}
