import type {GedcomFamily} from './gedcomFamily';
import {GedcomRecord} from './gedcomRecord';

export function serializeGedcomFamilyToGedcomRecord(gedcomFamily: GedcomFamily) {
  if (gedcomFamily.gedcomRecord) {
    return gedcomFamily.gedcomRecord;
  } else {
    return new GedcomRecord(0, gedcomFamily.xref, 'FAM', 'FAM', undefined, [
      // TODO: Fill in.
    ]);
  }
}
