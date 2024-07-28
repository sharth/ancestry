import {Dexie} from 'dexie';
import {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomRepository} from '../gedcom/gedcomRepository';

class AncestryDatabase extends Dexie {
  repositories!: Dexie.Table<GedcomRepository, string>;
  sources!: Dexie.Table<GedcomSource, string>;

  constructor() {
    super('AncestryDatabase');
    this.version(1).stores({
      repositories: 'xref',
      sources: 'xref',
    });

    this.repositories.mapToClass(GedcomRepository);
    this.sources.mapToClass(GedcomSource);
  }
}

export const ancestryDatabase = new AncestryDatabase();
