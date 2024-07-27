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

  readonly citations = computed(() => ancestryService.individuals()
      .flatMap((individual) => individual.events.map((event) => ({individual, event})))
      .flatMap(({individual, event}) => event.citations.map((citation) => ({individual, event, citation})))
      .filter(({citation}) => citation.sourceXref == this.xref));

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
