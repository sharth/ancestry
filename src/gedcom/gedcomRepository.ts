import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomRepository {
  xref: string;
  name: string;
}

export function parseGedcomRepository(
  gedcomRecord: GedcomRecord,
): GedcomRepository {
  if (gedcomRecord.tag !== "REPO") throw new Error();
  if (gedcomRecord.xref == "") throw new Error();
  if (gedcomRecord.value != "") throw new Error();

  const gedcomRepository: GedcomRepository = {
    xref: gedcomRecord.xref,
    name: "",
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length != 0) throw new Error();
        gedcomRepository.name = childRecord.value;
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
  return gedcomRepository;
}

export function serializeGedcomRepository(
  gedcomRepository: GedcomRepository,
): GedcomRecord {
  return {
    tag: "REPO",
    abstag: "REPO",
    xref: gedcomRepository.xref,
    value: "",
    children: [
      {
        tag: "NAME",
        abstag: "REPO.NAME",
        xref: "",
        value: gedcomRepository.name,
        children: [],
      },
    ].filter((record) => record.children.length || record.value),
  };
}
