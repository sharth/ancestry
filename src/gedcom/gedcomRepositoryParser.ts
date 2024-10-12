import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";
import { GedcomRepository } from "./gedcomRepository";

export function parseGedcomRepository(
  gedcomRecord: GedcomRecord
): GedcomRepository {
  if (gedcomRecord.tag !== "REPO") throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const gedcomRepository = new GedcomRepository(gedcomRecord.xref);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
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
