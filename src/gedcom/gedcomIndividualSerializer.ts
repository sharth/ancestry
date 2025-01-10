import type { GedcomDate } from "./gedcomDate";
import type { GedcomIndividual } from "./gedcomIndividual";
import type { GedcomRecord } from "./gedcomRecord";
import { serializeGedcomEvent } from "./gedcomEventSerializer";
import { serializeGedcomName } from "./gedcomNameSerializer";
import { serializeSex } from "./gedcomSexSerializer";
import { serializeGedcomDate } from "./gedcomDateSerializer";

export function serializeGedcomIndividual(
  gedcomIndividual: GedcomIndividual
): GedcomRecord {
  return {
    xref: gedcomIndividual.xref,
    tag: "INDI",
    abstag: "INDI",
    children: [
      ...gedcomIndividual.names.map((name) => serializeGedcomName(name)),
      gedcomIndividual.sex ? serializeSex(gedcomIndividual.sex) : null,
      gedcomIndividual.familySearchId
        ? serializeFamilySearchId(gedcomIndividual.familySearchId)
        : null,
      gedcomIndividual.changeDate
        ? serializeChangeDate(gedcomIndividual.changeDate)
        : null,
      ...gedcomIndividual.events.map((event) => serializeGedcomEvent(event)),
    ]
      .filter((record) => record != null)
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

function serializeChangeDate(date: GedcomDate): GedcomRecord {
  return {
    tag: "CHAN",
    abstag: "INDI.CHAN",
    value: undefined,
    children: [serializeGedcomDate(date)],
  };
}
