import type { GedcomIndividual } from "./gedcomIndividual";
import { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual
): GedcomRecord {
  if (gedcomIndividual.gedcomRecord) {
    return gedcomIndividual.gedcomRecord;
  }

  return new GedcomRecord(
    gedcomIndividual.xref,
    "INDI",
    "INDI",
    undefined,
    [
      serializeFamilySearchId(gedcomIndividual),
      serializeSex(gedcomIndividual),
      // TODO: Serialize events, name, surname
    ].filter((record) => record !== null)
  );
}

function serializeFamilySearchId(
  gedcomIndividual: GedcomIndividual
): GedcomRecord | null {
  if (gedcomIndividual.familySearchId == null) {
    return null;
  } else {
    return new GedcomRecord(
      undefined,
      "_FSFTID",
      "INDI._FSFTID",
      gedcomIndividual.familySearchId,
      []
    );
  }
}

function serializeSex(gedcomIndividual: GedcomIndividual): GedcomRecord | null {
  switch (gedcomIndividual.sex) {
    case undefined:
      return null;
    case "Male":
      return new GedcomRecord(undefined, "SEX", "INDI.SEX", "M", []);
    case "Female":
      return new GedcomRecord(undefined, "SEX", "INDI.SEX", "F", []);
  }
}
