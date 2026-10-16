import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomRepository {
  xref: string;
  name: string;
  changeDate: GedcomChangeDate;
}

export function newGedcomRepository(
  fieldsToUpdate: Partial<GedcomRepository> & Pick<GedcomRepository, "xref">,
): GedcomRepository {
  return {
    name: "",
    changeDate: newGedcomChangeDate(),
    ...fieldsToUpdate,
  };
}

export function parseGedcomRepository(
  gedcomRecord: GedcomRecord,
): GedcomRepository {
  if (gedcomRecord.tag !== "REPO") throw new Error();
  if (gedcomRecord.xref == "") throw new Error();
  if (gedcomRecord.value != "") throw new Error();

  const gedcomRepository = newGedcomRepository({
    xref: gedcomRecord.xref,
  });

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length != 0) throw new Error();
        gedcomRepository.name = childRecord.value;
        break;

      case "CHAN":
        gedcomRepository.changeDate = parseGedcomChangeDate(childRecord);
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
  return newGedcomRecord({
    tag: "REPO",
    abstag: "REPO",
    xref: gedcomRepository.xref,
    children: filterTrivialGedcomRecords([
      newGedcomRecord({
        tag: "NAME",
        abstag: "REPO.NAME",
        value: gedcomRepository.name,
      }),
      serializeGedcomChangeDate(gedcomRepository.changeDate),
    ]),
  });
}
