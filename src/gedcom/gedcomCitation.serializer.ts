import type {GedcomCitation} from './gedcomCitation';
import {GedcomRecord} from './gedcomRecord';
import {serializeGedcomRecordToText} from './gedcomRecord.serializer';

export function serializeGedcomCitationToGedcomRecord(gedcomCitation: GedcomCitation, level: number): GedcomRecord {
  if (gedcomCitation.gedcomRecord) {
    return gedcomCitation.gedcomRecord;
  }
  return new GedcomRecord(level, undefined, 'SOUR', '', gedcomCitation.sourceXref, [
    gedcomCitation.obje ? new GedcomRecord(level + 1, undefined, 'OBJE', '', gedcomCitation.obje, []) : null,
    gedcomCitation.name ? new GedcomRecord(level + 1, undefined, 'NAME', '', gedcomCitation.name, []) : null,
    gedcomCitation.note ? new GedcomRecord(level + 1, undefined, 'NOTE', '', gedcomCitation.note, []) : null,
    gedcomCitation.page ? new GedcomRecord(level + 1, undefined, 'PAGE', '', gedcomCitation.page, []) : null,
    gedcomCitation.text ? new GedcomRecord(level + 1, undefined, 'DATA', '', undefined, [
      new GedcomRecord(level + 2, undefined, 'TEXT', '', gedcomCitation.text, []),
    ]) : null,
  ].filter((record) => record != null));
}
