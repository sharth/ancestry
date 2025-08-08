import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomSubmitter {
  xref: string;
  name?: string;
  email?: string;
}

export function parseGedcomSubmitter(
  gedcomRecord: GedcomRecord,
): GedcomSubmitter {
  if (gedcomRecord.tag !== "SUBM") throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const gedcomSubmitter: GedcomSubmitter = {
    xref: gedcomRecord.xref,
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.name = childRecord.value;
        break;
      case "_EMAIL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.email = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomSubmitter;
}

export function serializeGedcomSubmitter(
  gedcomSubmitter: GedcomSubmitter,
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
