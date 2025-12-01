import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomTrailer {
  record?: GedcomRecord;
}

export function parseGedcomTrailer(gedcomRecord: GedcomRecord): GedcomTrailer {
  if (gedcomRecord.abstag !== "TRLR") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value != "") throw new Error();
  if (gedcomRecord.children.length != 0) throw new Error();

  return {
    record: gedcomRecord,
  };
}

export function serializeGedcomTrailer(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gedcomTrailer: GedcomTrailer,
): GedcomRecord {
  return {
    tag: "TRLR",
    abstag: "TRLR",
    xref: "",
    value: "",
    children: [],
  };
}
