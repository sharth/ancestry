import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSex } from "./gedcomSex";
import { serializeGedcomCitation } from "./gedcomCitationSerializer";

export function serializeSex(gedcomSex: GedcomSex): GedcomRecord {
  return {
    tag: "SEX",
    abstag: "INDI.SEX",
    value: gedcomSex.sex,
    children: [...gedcomSex.citations.map((c) => serializeGedcomCitation(c))],
  };
}
