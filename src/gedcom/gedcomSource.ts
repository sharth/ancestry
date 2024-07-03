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
  constructor(public xref: string, private ancestryService: AncestryService) {}

  static constructFromGedcom(record: GedcomRecord, ancestryService: AncestryService): GedcomSource {
    if (record.abstag !== 'SOUR') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    const gedcomSource = new GedcomSource(record.xref, ancestryService);

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'ABBR':
          if (gedcomSource.abbr != null) throw new Error();
          gedcomSource.abbr = GedcomSourceAbbreviation.constructFromGedcom(childRecord, ancestryService);
          gedcomSource.childRecords.push(gedcomSource.abbr);
          break;
        case 'TEXT':
          if (gedcomSource.text != null) throw new Error();
          gedcomSource.text = GedcomSourceText.constructFromGedcom(childRecord, ancestryService);
          gedcomSource.childRecords.push(gedcomSource.text);
          break;
        case 'TITL':
          if (gedcomSource.title != null) throw new Error();
          gedcomSource.title = GedcomSourceTitle.constructFromGedcom(childRecord, ancestryService);
          gedcomSource.childRecords.push(gedcomSource.title);
          break;
        case 'REPO': {
          const sourceRepository = new GedcomSourceRepository(childRecord, ancestryService);
          gedcomSource.repositories.push(sourceRepository);
          gedcomSource.childRecords.push(sourceRepository);
          break;
        }
        default: {
          const unknown = new GedcomUnknown(childRecord);
          gedcomSource.unknowns.push(unknown);
          gedcomSource.childRecords.push(unknown);
          break;
        }
      }
    }

    return gedcomSource;
  }

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

  clone(): GedcomSource {
    const cloned = new GedcomSource(this.xref, this.ancestryService);
    cloned.abbr = this.abbr;
    cloned.title = this.title;
    cloned.text = this.text;
    cloned.repositories = this.repositories;
    cloned.unknowns = this.unknowns;
    return cloned;
  }

  private updateChildRecords(
      oldRecord: {gedcomRecord: () => GedcomRecord} | null | undefined,
      newRecord: {gedcomRecord: () => GedcomRecord} | null | undefined): {gedcomRecord: () => GedcomRecord}[] {
    if (oldRecord != null && newRecord != null) {
      return this.childRecords.toSpliced(this.childRecords.indexOf(oldRecord), 1, newRecord);
    } else if (oldRecord != null && newRecord == null) {
      return this.childRecords.toSpliced(this.childRecords.indexOf(oldRecord), 1);
    } else if (oldRecord == null && newRecord != null) {
      return this.childRecords.toSpliced(-1, 0, newRecord);
    } else {
      return this.childRecords;
    }
  }

  updateAbbr(value: string | null): GedcomSource {
    if (this.abbr?.value == value) {
      return this;
    } else {
      const cloned = this.clone();
      cloned.abbr = value ? new GedcomSourceAbbreviation(value, this.ancestryService) : undefined;
      cloned.childRecords = this.updateChildRecords(this.abbr, cloned.abbr);
      return cloned;
    }
  }

  updateTitle(value: string | null): GedcomSource {
    if (this.title?.value == value) {
      return this;
    } else {
      const cloned = this.clone();
      cloned.title = value ? new GedcomSourceTitle(value, this.ancestryService) : undefined;
      cloned.childRecords = this.updateChildRecords(this.title, cloned.title);
      return cloned;
    }
  }

  updateText(value: string | null): GedcomSource {
    if (this.text?.value == value) {
      return this;
    } else {
      const cloned = this.clone();
      cloned.text = value ? new GedcomSourceText(value, this.ancestryService) : undefined;
      cloned.childRecords = this.updateChildRecords(this.text, cloned.text);
      return cloned;
    }
  }
}
