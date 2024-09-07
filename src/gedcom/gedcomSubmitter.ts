import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomSubmitter {
  constructor(public readonly xref: string, public readonly gedcomRecord: GedcomRecord) {}
  name?: string;
  email?: string;
};

export function constructGedcomSubmitterFromGedcomRecord(gedcomRecord: GedcomRecord): GedcomSubmitter {
  if (gedcomRecord.abstag !== 'SUBM') throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const gedcomSubmitter = new GedcomSubmitter(gedcomRecord.xref, gedcomRecord);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case 'NAME':
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.name = childRecord.value;
        break;
      case '_EMAIL':
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.email = childRecord.value;
        break;
      default:
        ancestryService.reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomSubmitter;
}
