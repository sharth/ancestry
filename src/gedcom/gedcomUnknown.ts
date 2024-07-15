import type {GedcomRecord} from './gedcomRecord';

export class GedcomUnknown {
  constructor(gedcomRecord: GedcomRecord) {
    this._gedcomRecord = gedcomRecord;
  }

  gedcomRecord(): GedcomRecord {
    return this._gedcomRecord;
  }

  private _gedcomRecord: GedcomRecord;
};
