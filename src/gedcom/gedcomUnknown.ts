import type {GedcomRecord} from './gedcomRecord';

export class GedcomUnknown {
  constructor(gedcomRecord: GedcomRecord) {
    this.#gedcomRecord = gedcomRecord;
  }

  gedcomRecord(): GedcomRecord {
    return this.#gedcomRecord;
  }

  #gedcomRecord: GedcomRecord;
};
