import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomMultimediaLink } from "./gedcomMultimediaLink";
import {
  parseGedcomMultimediaLink,
  serializeGedcomMultimediaLink,
} from "./gedcomMultimediaLink";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomRepositoryLink } from "./gedcomRepositoryLink";
import {
  parseGedcomRepositoryLink,
  serializeGedcomRepositoryLink,
} from "./gedcomRepositoryLink";

export interface GedcomSource {
  xref: string;
  abbr: string;
  title: string;
  text: string;
  repositoryLinks: GedcomRepositoryLink[];
  unknownRecords: GedcomRecord[];
  multimediaLinks: GedcomMultimediaLink[];
}

export function parseGedcomSource(record: GedcomRecord): GedcomSource {
  if (record.abstag !== "SOUR") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomSource: GedcomSource = {
    xref: record.xref,
    abbr: "",
    title: "",
    text: "",
    repositoryLinks: [],
    unknownRecords: [],
    multimediaLinks: [],
  };

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
      default:
        gedcomSource.unknownRecords.push(childRecord);
        break;
    }
  }

  return gedcomSource;
}

export function serializeGedcomSource(source: GedcomSource): GedcomRecord {
  return {
    xref: source.xref,
    tag: "SOUR",
    abstag: "SOUR",
    value: "",
    children: [
      {
        tag: "ABBR",
        abstag: "SOUR.ABBR",
        xref: "",
        value: source.abbr,
        children: [],
      },
      {
        tag: "TITL",
        abstag: "SOUR.TITL",
        xref: "",
        value: source.title,
        children: [],
      },
      ...source.unknownRecords.filter((record) => record.tag == "_SUBQ"),
      ...source.unknownRecords.filter((record) => record.tag == "_BIBL"),
      {
        tag: "TEXT",
        abstag: "SOUR.TEXT",
        xref: "",
        value: source.text,
        children: [],
      },
      ...source.repositoryLinks.map((repositoryLink) =>
        serializeGedcomRepositoryLink(repositoryLink),
      ),
      ...source.multimediaLinks.map((multimediaLink) =>
        serializeGedcomMultimediaLink(multimediaLink),
      ),
      ...source.unknownRecords.filter(
        (record) => record.tag != "_SUBQ" && record.tag != "_BIBL",
      ),
    ].filter((record) => record.children.length || record.value),
  };
}
