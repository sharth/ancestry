import type {GedcomEvent} from './gedcomEvent';
import {GedcomRecord} from './gedcomRecord';

export function serializeGedcomEventToGedcomRecord(gedcomEvent: GedcomEvent): GedcomRecord {
  if (gedcomEvent.gedcomRecord) {
    return gedcomEvent.gedcomRecord;
  } else {
    // TODO: Build something useful.
    return new GedcomRecord(0, undefined, 'EVEN', 'EVEN', undefined, []);
  }
}
