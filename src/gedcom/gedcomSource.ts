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
    repositoryXref: string,
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
    cloned.abbr = structuredClone(this.abbr);
    cloned.title = structuredClone(this.title);
    cloned.text = structuredClone(this.text);
    cloned.repositoryCitations = structuredClone(this.repositoryCitations);
    cloned.unknownRecords = [...this.unknownRecords];
    cloned.canonicalGedcomRecord = undefined;
    return cloned;
  }
}
