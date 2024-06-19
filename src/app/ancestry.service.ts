import {computed, Injectable, signal} from '@angular/core';
import type {GedcomFamily} from '../gedcom/gedcomFamily';
import type {GedcomIndividual} from '../gedcom/gedcomIndividual';
import type {GedcomRepository} from '../gedcom/gedcomRepository';
import type {GedcomSource} from '../gedcom/gedcomSource';
import type {GedcomHeader} from '../gedcom/gedcomHeader';
import type {GedcomRecord} from '../gedcom/gedcomRecord';
import type {GedcomTrailer} from '../gedcom/gedcomTrailer';
import {Map as ImmutableMap} from 'immutable';

@Injectable({providedIn: 'root'})
export class AncestryService {
  readonly header = signal<GedcomHeader|undefined>(undefined);
  readonly trailer = signal<GedcomTrailer|undefined>(undefined);

  readonly individuals = signal(ImmutableMap<string, GedcomIndividual>({}));
  readonly families = signal(ImmutableMap<string, GedcomFamily>());
  readonly sources = signal(ImmutableMap<string, GedcomSource>());
  readonly repositories = signal(ImmutableMap<string, GedcomRepository>());

  individual(xref: string): GedcomIndividual {
    const individual = this.individuals().get(xref);
    if (individual == null) throw new Error(`No individual with xref '${xref}'`);
    return individual;
  }

  family(xref: string): GedcomFamily {
    const family = this.families().get(xref);
    if (family == null) throw new Error(`No family with xref '${xref}'`);
    return family;
  }

  repository(xref: string): GedcomRepository {
    const repository = this.repositories().get(xref);
    if (repository == null) throw new Error(`No repository with xref '${xref}`);
    return repository;
  }

  source(xref: string): GedcomSource {
    const source = this.sources().get(xref);
    if (source == null) throw new Error(`No source with xref '${xref}`);
    return source;
  }

  gedcomRecords = computed<GedcomRecord[]>(() => {
    const gedcom = [];
    const header = this.header();
    if (header) {
      gedcom.push(header.record);
    }
    for (const individual of this.individuals().values()) {
      if (individual.gedcomRecord) {
        gedcom.push(individual.gedcomRecord);
      }
    }
    for (const family of this.families().values()) {
      if (family.gedcomRecord) {
        gedcom.push(family.gedcomRecord);
      }
    }
    for (const source of this.sources().values()) {
      if (source.gedcomRecord) {
        gedcom.push(source.gedcomRecord);
      }
    }
    for (const repository of this.repositories().values()) {
      if (repository.gedcomRecord) {
        gedcom.push(repository.gedcomRecord);
      }
    }
    const trailer = this.trailer();
    if (trailer) {
      gedcom.push(trailer.record);
    }
    return gedcom;
  });

  reset(): void {
    this.header.set(undefined);
    this.individuals.set(ImmutableMap<string, GedcomIndividual>({}));
    this.families.set(ImmutableMap<string, GedcomFamily>());
    this.sources.set(ImmutableMap<string, GedcomSource>());
    this.repositories .set(ImmutableMap<string, GedcomRepository>());
  }
}
