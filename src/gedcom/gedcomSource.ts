import type {AncestryService} from '../app/ancestry.service';
import {GedcomRecord} from './gedcomRecord';
import {GedcomSourceAbbreviation} from './gedcomSourceAbbreviation';
import {GedcomSourceRepository} from './gedcomSourceRepository';
import {GedcomSourceText} from './gedcomSourceText';
import {GedcomSourceTitle} from './gedcomSourceTitle';

export class GedcomSource {
  constructor(
      private record: GedcomRecord,
      private ancestryService: AncestryService) {
    if (record.abstag !== 'SOUR') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'ABBR':
          if (this.abbr != null) throw new Error();
          this.abbr = new GedcomSourceAbbreviation(childRecord, ancestryService);
          this.childRecords.push(this.abbr);
          break;
        case 'TEXT':
          if (this.text != null) throw new Error();
          this.text = new GedcomSourceText(childRecord, ancestryService);
          this.childRecords.push(this.text);
          break;
        case 'TITL':
          if (this.title != null) throw new Error();
          this.title = new GedcomSourceTitle(childRecord, ancestryService);
          this.childRecords.push(this.title);
          break;
        case 'REPO': {
          const sourceRepository = new GedcomSourceRepository(childRecord, ancestryService);
          this.repositories.push(sourceRepository);
          this.childRecords.push(sourceRepository);
          break;
        }
        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  xref: string;
  abbr?: GedcomSourceAbbreviation;
  title?: GedcomSourceTitle;
  text?: GedcomSourceText;
  repositories: GedcomSourceRepository[] = [];

  childRecords: {gedcomRecord: () => GedcomRecord}[] = [];

  gedcomRecord(): GedcomRecord {
    return new GedcomRecord(
        0, this.xref, 'SOUR', 'SOUR', undefined,
        this.childRecords.map((record) => record.gedcomRecord()));
  }
};
