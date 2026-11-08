import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  parseGedcomMultimediaLink,
  serializeGedcomMultimediaLink,
  type GedcomMultimediaLink,
} from "./gedcomMultimediaLink";
import {
  filterTrivialGedcomRecords,
  gedcomRecordsEqual,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  parseGedcomRepositoryLink,
  serializeGedcomRepositoryLink,
  type GedcomRepositoryLink,
} from "./gedcomRepositoryLink";

export interface GedcomSource {
  xref: string;
  abbr: string;
  title: string;
  text: string;
  repositoryLinks: GedcomRepositoryLink[];
  unknownRecords: GedcomRecord[];
  multimediaLinks: GedcomMultimediaLink[];
  changeDate: GedcomChangeDate;
}

export function newGedcomSource(
  fieldsToUpdate: Partial<GedcomSource> & Pick<GedcomSource, "xref">,
): GedcomSource {
  return {
    abbr: "",
    title: "",
    text: "",
    repositoryLinks: [],
    unknownRecords: [],
    multimediaLinks: [],
    changeDate: newGedcomChangeDate(),
    ...fieldsToUpdate,
  };
}

export function parseGedcomSource(record: GedcomRecord): GedcomSource {
  if (record.tag !== "SOUR") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomSource = newGedcomSource({ xref: record.xref });

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "ABBR":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (gedcomSource.abbr != "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.abbr = childRecord.value;
        break;
      case "TEXT":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (gedcomSource.text != "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.text = childRecord.value;
        break;
      case "TITL":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (gedcomSource.title != "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.title = childRecord.value;
        break;
      case "REPO":
        gedcomSource.repositoryLinks.push(
          parseGedcomRepositoryLink(childRecord),
        );
        break;
      case "OBJE":
        gedcomSource.multimediaLinks.push(
          parseGedcomMultimediaLink(childRecord),
        );
        break;
      case "CHAN":
        gedcomSource.changeDate = parseGedcomChangeDate(childRecord);
        break;
      default:
        gedcomSource.unknownRecords.push(childRecord);
        break;
    }
  }

  // Seed the serialization cache. When the source serializes back to
  // exactly the record it was parsed from, cache that record itself, so
  // comparing an unedited source against the file is an identity check.
  const serialized = serializeGedcomSource(gedcomSource);
  serializedSources.set(
    gedcomSource,
    gedcomRecordsEqual(serialized, record) ? record : serialized,
  );

  return gedcomSource;
}

// Each source's serialization, by object. Sources are only ever changed
// through immer, which makes a new object for an edited one and keeps an
// unedited one as the same object, so a cached serialization never goes
// stale. See serializeGedcomIndividual.
const serializedSources = new WeakMap<GedcomSource, GedcomRecord>();

export function serializeGedcomSource(source: GedcomSource): GedcomRecord {
  return serializedSources.getOrInsertComputed(source, () =>
    newGedcomRecord({
      xref: source.xref,
      tag: "SOUR",
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "ABBR",
          value: source.abbr,
        }),
        newGedcomRecord({
          tag: "TITL",
          value: source.title,
        }),
        ...source.unknownRecords.filter((record) => record.tag == "_SUBQ"),
        ...source.unknownRecords.filter((record) => record.tag == "_BIBL"),
        newGedcomRecord({
          tag: "TEXT",
          value: source.text,
        }),
        serializeGedcomChangeDate(source.changeDate),
        ...source.repositoryLinks.map((repositoryLink) =>
          serializeGedcomRepositoryLink(repositoryLink),
        ),
        ...source.multimediaLinks.map((multimediaLink) =>
          serializeGedcomMultimediaLink(multimediaLink),
        ),
        ...source.unknownRecords.filter(
          (record) => record.tag != "_SUBQ" && record.tag != "_BIBL",
        ),
      ]),
    }),
  );
}
