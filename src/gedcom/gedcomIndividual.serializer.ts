import type {GedcomIndividual} from './gedcomIndividual';
import {GedcomRecord} from './gedcomRecord';

export function serializeGedcomIndividualToGedcomRecord(gedcomIndividual: GedcomIndividual): GedcomRecord {
  if (gedcomIndividual.gedcomRecord) {
    return gedcomIndividual.gedcomRecord;
  }

  return new GedcomRecord(0, gedcomIndividual.xref, 'INDI', 'INDI', undefined, [
    serializeFamilySearchIdToGedcomRecord(gedcomIndividual),
    serializeSexToGedcomRecord(gedcomIndividual),
    // TODO: Serialize events, name, surname
  ].filter((record) => record !== null));
}

function serializeFamilySearchIdToGedcomRecord(gedcomIndividual: GedcomIndividual): GedcomRecord | null {
  if (gedcomIndividual.familySearchId == null) {
    return null;
  } else {
    return new GedcomRecord(1, undefined, '_FSFTID', 'INDI._FSFTID', gedcomIndividual.familySearchId, []);
  }
}

function serializeSexToGedcomRecord(gedcomIndividual: GedcomIndividual): GedcomRecord | null {
  switch (gedcomIndividual.sex) {
    case undefined:
      return null;
    case 'Male':
      return new GedcomRecord(1, undefined, 'SEX', 'INDI.SEX', 'M', []);
    case 'Female':
      return new GedcomRecord(1, undefined, 'SEX', 'INDI.SEX', 'F', []);
  }
}
