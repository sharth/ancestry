import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  filterTrivialGedcomRecords,
  gedcomRecordsEqual,
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

  // Seed the serialization cache. When the repository serializes back to
  // exactly the record it was parsed from, cache that record itself, so
  // comparing an unedited repository against the file is an identity check.
  const serialized = serializeGedcomRepository(gedcomRepository);
  serializedRepositories.set(
    gedcomRepository,
    gedcomRecordsEqual(serialized, gedcomRecord) ? gedcomRecord : serialized,
  );

  return gedcomRepository;
}

// Each repository's serialization, by object. Repositories are only ever
// changed through immer, which makes a new object for an edited one and
// keeps an unedited one as the same object, so a cached serialization never
// goes stale. See serializeGedcomIndividual.
const serializedRepositories = new WeakMap<GedcomRepository, GedcomRecord>();

export function serializeGedcomRepository(
  gedcomRepository: GedcomRepository,
): GedcomRecord {
  return serializedRepositories.getOrInsertComputed(gedcomRepository, () =>
    newGedcomRecord({
      tag: "REPO",
      xref: gedcomRepository.xref,
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "NAME",
          value: gedcomRepository.name,
        }),
        serializeGedcomChangeDate(gedcomRepository.changeDate),
      ]),
    }),
  );
}
