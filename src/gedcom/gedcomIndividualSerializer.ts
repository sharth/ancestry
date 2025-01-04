import type { GedcomIndividual } from "./gedcomIndividual";
import type { GedcomRecord } from "./gedcomRecord";
import { serializeGedcomEvent } from "./gedcomEventSerializer";
import { serializeGedcomName } from "./gedcomNameSerializer";

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual
): GedcomRecord {
  if (gedcomIndividual.gedcomRecord) {
    return gedcomIndividual.gedcomRecord;
  }

  return {
    xref: gedcomIndividual.xref,
    tag: "INDI",
    abstag: "INDI",
    children: [
      ...gedcomIndividual.names.map((name) => serializeGedcomName(name)),
      serializeFamilySearchId(gedcomIndividual),
      serializeSex(gedcomIndividual),
      ...gedcomIndividual.events.map((event) => serializeGedcomEvent(event)),
    ]
      .filter((record) => record !== null)
      .filter((record) => record.children.length || record.value),
  };
}

function serializeFamilySearchId(
  gedcomIndividual: GedcomIndividual
): GedcomRecord | null {
  switch (gedcomIndividual.familySearchId) {
    case undefined:
      return null;
    default:
      return {
        tag: "_FSFTID",
        abstag: "INDI._FSFTID",
        value: gedcomIndividual.familySearchId,
        children: [],
      };
  }
}

function serializeSex(gedcomIndividual: GedcomIndividual): GedcomRecord | null {
  switch (gedcomIndividual.sex) {
    case undefined:
      return null;
    case "Male":
      return {
        tag: "SEX",
        abstag: "INDI.SEX",
        value: "M",
        children: [],
      };
    case "Female":
      return {
        tag: "SEX",
        abstag: "INDI.SEX",
        value: "F",
        children: [],
      };
  }
}
