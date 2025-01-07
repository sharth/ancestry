import type { GedcomIndividual } from "./gedcomIndividual";
import type { GedcomRecord } from "./gedcomRecord";
import { serializeGedcomEvent } from "./gedcomEventSerializer";
import { serializeGedcomName } from "./gedcomNameSerializer";
import { serializeSex } from "./gedcomSexSerializer";

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual
): GedcomRecord {
  return {
    xref: gedcomIndividual.xref,
    tag: "INDI",
    abstag: "INDI",
    children: [
      ...gedcomIndividual.names.map((name) => serializeGedcomName(name)),
      gedcomIndividual.familySearchId
        ? serializeFamilySearchId(gedcomIndividual.familySearchId)
        : null,
      gedcomIndividual.sex ? serializeSex(gedcomIndividual.sex) : null,
      ...gedcomIndividual.events.map((event) => serializeGedcomEvent(event)),
    ]
      .filter((record) => record !== null)
      .filter((record) => record.children.length || record.value),
  };
}

function serializeFamilySearchId(familySearchId: string): GedcomRecord {
  return {
    tag: "_FSFTID",
    abstag: "INDI._FSFTID",
    value: familySearchId,
    children: [],
  };
}
