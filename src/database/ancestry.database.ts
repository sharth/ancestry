import {Dexie} from 'dexie';
import {GedcomSource} from '../gedcom/gedcomSource';

class AncestryDatabase extends Dexie {
  sources!: Dexie.Table<GedcomSource, string>;

  constructor() {
    super('AncestryDatabase');
    this.version(1).stores({
      sources: 'xref',
    });
    this.sources.mapToClass(GedcomSource);
  }
}

export const ancestryDatabase = new AncestryDatabase();
