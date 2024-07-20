import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomCitation {
  constructor(private gedcomRecord: GedcomRecord) {
    if (gedcomRecord.tag !== 'SOUR') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value == null) throw new Error();

    this.sourceXref = gedcomRecord.value;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case '_TMPLT':
        case '_QUAL':
        case 'QUAY':
          break;
        case 'OBJE':
          childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
          this.obje = childRecord.value;
          break;
        case 'NAME':
          childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
          this.name = childRecord.value;
          break;
        case 'NOTE':
          childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
          this.note = childRecord.value;
          break;
        case 'PAGE':
          childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
          this.page = childRecord.value;
          break;
        case 'DATA':
          this.text = this.parseCitationData(childRecord);
          break;
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  private parseCitationData( gedcomRecord: GedcomRecord ): string|undefined {
    if (gedcomRecord.tag !== 'DATA') throw new Error();
    if (gedcomRecord.xref != null) throw new Error();
    if (gedcomRecord.value != null) throw new Error();

    let text: undefined|string = undefined;

    for (const childRecord of gedcomRecord.children) {
      switch (childRecord.tag) {
        case 'TEXT':
          childRecord.children.forEach(ancestryService.reportUnparsedRecord.bind(ancestryService));
          text ??= '';
          text += childRecord.value;
          break;
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
    return text;
  }

  sourceXref: string;
  name?: string;
  obje?: string;
  note?: string;
  text?: string;
  page?: string;
}
