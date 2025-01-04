import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSubmitter } from "./gedcomSubmitter";

export function serializeGedcomSubmitter(
  gedcomSubmitter: GedcomSubmitter
): GedcomRecord {
  return {
    xref: gedcomSubmitter.xref,
    tag: "SUBM",
    abstag: "SUBM",
    children: [
      {
        tag: "NAME",
        abstag: "SUBM.NAME",
        value: gedcomSubmitter.name,
        children: [],
      },
      {
        tag: "_EMAIL",
        abstag: "SUBM._EMAIL",
        value: gedcomSubmitter.email,
        children: [],
      },
    ].filter((childRecord) => childRecord.value),
  };
}
