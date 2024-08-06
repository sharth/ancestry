import {Dexie} from 'dexie';
import {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomRepository} from '../gedcom/gedcomRepository';
import {GedcomIndividual} from '../gedcom/gedcomIndividual';
import {GedcomFamily} from '../gedcom/gedcomFamily';

class AncestryDatabase extends Dexie {
  repositories!: Dexie.Table<GedcomRepository, string>;
  sources!: Dexie.Table<GedcomSource, string>;
  individuals!: Dexie.Table<GedcomIndividual, string>;
  families!: Dexie.Table<GedcomFamily, string>;

  constructor() {
    super('AncestryDatabase');
    this.version(1).stores({
      'repositories': 'xref',
      'sources': 'xref',
      'individuals': 'xref',
      'families': 'xref',
    });

    this.repositories.mapToClass(GedcomRepository);
    this.sources.mapToClass(GedcomSource);
    this.individuals.mapToClass(GedcomIndividual);
    this.families.mapToClass(GedcomFamily);
  }
}

export const ancestryDatabase = new AncestryDatabase();
