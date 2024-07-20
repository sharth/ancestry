import {ancestryService} from '../app/ancestry.service';
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
  constructor(public xref: string) {}

  static constructFromGedcom(record: GedcomRecord): GedcomSource {
    if (record.abstag !== 'SOUR') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    const gedcomSource = new GedcomSource(record.xref);

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'ABBR':
          if (gedcomSource.abbr != null) throw new Error();
          gedcomSource.abbr = GedcomSourceAbbreviation.constructFromGedcom(childRecord);
          gedcomSource.childRecords.push(gedcomSource.abbr);
          break;
        case 'TEXT':
          if (gedcomSource.text != null) throw new Error();
          gedcomSource.text = GedcomSourceText.constructFromGedcom(childRecord);
          gedcomSource.childRecords.push(gedcomSource.text);
          break;
        case 'TITL':
          if (gedcomSource.title != null) throw new Error();
          gedcomSource.title = GedcomSourceTitle.constructFromGedcom(childRecord);
          gedcomSource.childRecords.push(gedcomSource.title);
          break;
        case 'REPO': {
          const sourceRepository = GedcomSourceRepository.constructFromGedcom(childRecord);
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
    for (const individual of ancestryService.individuals().values()) {
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
    const cloned = new GedcomSource(this.xref);
    cloned.abbr = this.abbr;
    cloned.title = this.title;
    cloned.text = this.text;
    cloned.repositories = this.repositories;
    cloned.unknowns = this.unknowns;
    cloned.childRecords = this.childRecords;
    return cloned;
  }

  modify(changes: {
    abbr: string
    title: string
    text: string
    repositories: {repositoryXref: string, callNumber: string}[]
    unknowns: GedcomRecord[]
  }): GedcomSource {
    const clone = this.clone();
    clone.abbr = changes.abbr ? new GedcomSourceAbbreviation(changes.abbr) : undefined;
    clone.replaceChildRecord(this.abbr, clone.abbr);
    clone.title = changes.title ? new GedcomSourceTitle(changes.title) : undefined;
    clone.replaceChildRecord(this.title, clone.title);
    clone.text = changes.text ? new GedcomSourceText(changes.text) : undefined;
    clone.replaceChildRecord(this.text, clone.text);

    // FIXME: This fails to maintain the order of the SOUR.REPO records within the larger SOUR record.
    clone.repositories = changes.repositories
        .map((sr) => new GedcomSourceRepository(
            sr.repositoryXref,
            (sr.callNumber ? [sr.callNumber] : [])));
    this.repositories.forEach((sr) => clone.replaceChildRecord(sr, undefined));
    clone.repositories.forEach((sr) => clone.replaceChildRecord(undefined, sr));

    // FIXME: This fails to maintain the order of the unknown records within the larger SOUR record.
    clone.unknowns = changes.unknowns
        .map((unknown) => new GedcomUnknown(unknown));
    this.unknowns.forEach((unknown) => clone.replaceChildRecord(unknown, undefined));
    clone.unknowns.forEach((unknown) => clone.replaceChildRecord(undefined, unknown));

    return clone;
  }

  private replaceChildRecord(
      oldRecord?: typeof this.childRecords[0],
      newRecord?: typeof this.childRecords[0]) {
    if (oldRecord !== undefined && newRecord !== undefined) {
      this.childRecords.splice(this.childRecords.indexOf(oldRecord), 1, newRecord);
    } else if (oldRecord !== undefined && newRecord === undefined) {
      this.childRecords.splice(this.childRecords.indexOf(oldRecord), 1);
    } else if (oldRecord === undefined && newRecord !== undefined) {
      this.childRecords.push(newRecord);
    }
  }
}
