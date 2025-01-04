import { serializeGedcomEvent } from "./gedcomEventSerializer";
import type { GedcomFamily } from "./gedcomFamily";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomFamily(
  gedcomFamily: GedcomFamily
): GedcomRecord {
  return {
    xref: gedcomFamily.xref,
    tag: "FAM",
    abstag: "FAM",
    children: [
      {
        tag: "HUSB",
        abstag: "FAM.HUSB",
        value: gedcomFamily.husbandXref,
        children: [],
      },
      {
        tag: "WIFE",
        abstag: "FAM.WIFE",
        value: gedcomFamily.wifeXref,
        children: [],
      },
      ...gedcomFamily.childXrefs.map((childXref) => ({
        tag: "CHIL",
        abstag: "FAM.CHIL",
        value: childXref,
        children: [],
      })),
      ...gedcomFamily.events.map((event) => serializeGedcomEvent(event)),
    ].filter((record) => record.children.length || record.value),
  };
}
