import {GedcomFamily} from './gedcomFamily';
import {GedcomHeader} from './gedcomHeader';
import {GedcomIndividual} from './gedcomIndividual';
import {GedcomRecord} from './gedcomRecord';
import {GedcomRepository} from './gedcomRepository';
import {GedcomSource} from './gedcomSource';

export class GedcomDatabase {
  header?: GedcomHeader;
  individuals = new Map<string, GedcomIndividual>();
  families = new Map<string, GedcomFamily>();
  repositories = new Map<string, GedcomRepository>();
  sources = new Map<string, GedcomSource>();

  individual(xref: string): GedcomIndividual {
    if (!xref.startsWith('@I')) throw new Error();
    let individual = this.individuals.get(xref);
    if (individual == null) this.individuals.set(xref, individual = new GedcomIndividual(xref));
    return individual;
  }

  family(xref: string): GedcomFamily {
    if (!xref.startsWith('@F')) throw new Error();
    let family = this.families.get(xref);
    if (family == null) this.families.set(xref, family = new GedcomFamily(xref));
    return family;
  }

  individualOrFamily(xref: string): (GedcomIndividual | GedcomFamily) {
    if (xref.startsWith('@I')) return this.individual(xref);
    if (xref.startsWith('@F')) return this.family(xref);
    throw new Error();
  }

  repository(xref: string): GedcomRepository {
    let gedcomRepository = this.repositories.get(xref);
    if (gedcomRepository == null) {
      this.repositories.set(xref, gedcomRepository = new GedcomRepository(xref));
    }
    return gedcomRepository;
  }

  source(xref: string): GedcomSource {
    if (!xref.startsWith('@S')) throw new Error();
    let source = this.sources.get(xref);
    if (source == null) this.sources.set(xref, source = new GedcomSource(xref));
    return source;
  }

  gedcomRecords(): GedcomRecord[] {
    const gedcom = [];
    if (this.header) {
      gedcom.push(this.header.record);
    }
    for (const individual of this.individuals.values()) {
      if (individual.gedcomRecord) {
        gedcom.push(individual.gedcomRecord);
      }
    }
    for (const family of this.families.values()) {
      if (family.gedcomRecord) {
        gedcom.push(family.gedcomRecord);
      }
    }
    for (const source of this.sources.values()) {
      if (source.gedcomRecord) {
        gedcom.push(source.gedcomRecord);
      }
    }
    for (const repository of this.repositories.values()) {
      if (repository.gedcomRecord) {
        gedcom.push(repository.gedcomRecord);
      }
    }
    return gedcom;
  }
};
