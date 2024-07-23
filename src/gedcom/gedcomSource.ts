import {computed} from '@angular/core';
import {ancestryService} from '../app/ancestry.service';
import type {GedcomCitation} from './gedcomCitation';
import type {GedcomEvent} from './gedcomEvent';
import type {GedcomIndividual} from './gedcomIndividual';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomSource {
  constructor(public xref: string) {}

  abbr?: string;
  title?: string;
  text?: string;
  repositoryCitations: {
    repositoryXref?:string,
    callNumbers: string[],
  }[] = [];
  unknownRecords: GedcomRecord[] = [];

  canonicalGedcomRecord?: GedcomRecord;

  readonly citations = computed<{individual: GedcomIndividual; event: GedcomEvent; citation: GedcomCitation}[]>(() => {
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
  });

  clone(): GedcomSource {
    const cloned = new GedcomSource(this.xref);
    cloned.abbr = this.abbr;
    cloned.title = this.title;
    cloned.text = this.text;
    cloned.repositoryCitations = [...this.repositoryCitations];
    cloned.unknownRecords = [...this.unknownRecords];
    cloned.canonicalGedcomRecord = undefined;
    return cloned;
  }

  modify(changes: {
    abbr: string
    title: string
    text: string
    repositoryCitations: {repositoryXref: string, callNumbers: string[]}[]
    unknownRecords: GedcomRecord[]
  }): GedcomSource {
    const clone = this.clone();
    clone.canonicalGedcomRecord = undefined;
    clone.abbr = changes.abbr || undefined;
    clone.title = changes.title || undefined;
    clone.text = changes.text || undefined;
    clone.repositoryCitations = [...changes.repositoryCitations];
    clone.unknownRecords = [...changes.unknownRecords];

    return clone;
  }
}
