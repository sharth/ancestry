import type { GedcomFamily } from "./gedcomFamily";

export function serializeGedcomFamily(gedcomFamily: GedcomFamily) {
  if (gedcomFamily.gedcomRecord) {
    return gedcomFamily.gedcomRecord;
  } else {
    return {
      xref: gedcomFamily.xref,
      tag: "FAM",
      abstag: "FAM",
      children: [
        // TODO: Fill in.
      ],
    };
  }
}
