import type {AncestryService} from '../app/ancestry.service';
import type {GedcomCitation} from './gedcomCitation';
import type {GedcomEvent} from './gedcomEvent';
import type {GedcomIndividual} from './gedcomIndividual';
import {GedcomRecord} from './gedcomRecord';
import {GedcomSourceAbbreviation} from './gedcomSourceAbbreviation';
import {GedcomSourceRepository} from './gedcomSourceRepository';
import {GedcomSourceText} from './gedcomSourceText';
import {GedcomSourceTitle} from './gedcomSourceTitle';
import {GedcomUnknown} from './gedcomUnknown';

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
        default: {
          const unknown = new GedcomUnknown(childRecord);
          this.unknowns.push(unknown);
          this.childRecords.push(unknown);
          ancestryService.reportUnparsedRecord(childRecord);
          break;
        }
      }
    }
  }

  xref: string;
  abbr?: GedcomSourceAbbreviation;
  title?: GedcomSourceTitle;
  text?: GedcomSourceText;
  repositories: GedcomSourceRepository[] = [];
  unknowns: GedcomUnknown[] = [];

  childRecords: {gedcomRecord: () => GedcomRecord}[] = [];

  gedcomRecord(): GedcomRecord {
    return new GedcomRecord(
        0, this.xref, 'SOUR', 'SOUR', undefined,
        this.childRecords.map((record) => record.gedcomRecord()));
  }

  citations(): { individual: GedcomIndividual; event: GedcomEvent; citation: GedcomCitation }[] {
    const arr = [];
    for (const individual of this.ancestryService.individuals().values()) {
      for (const event of individual.events) {
        for (const citation of event.citations) {
          if (citation.sourceXref == this.xref) {
            arr.push({individual: individual, event: event, citation: citation});
          }
        }
      }
    }
    return arr;
  }
};
