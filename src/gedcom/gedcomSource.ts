import type { GedcomRecord } from "./gedcomRecord";
import { reportUnparsedRecord } from "../util/record-unparsed-records";

export interface GedcomSource {
  xref: string;
  abbr?: string;
  title?: string;
  text?: string;
  repositoryCitations: {
    repositoryXref: string;
    callNumbers: string[];
  }[];
  unknownRecords: GedcomRecord[];
  multimediaLinks: {
    multimediaXref: string;
    title?: string;
  }[];
}

export function parseGedcomSource(record: GedcomRecord): GedcomSource {
  if (record.abstag !== "SOUR") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomSource: GedcomSource = {
    xref: record.xref,
    repositoryCitations: [],
    unknownRecords: [],
    multimediaLinks: [],
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "ABBR":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (gedcomSource.abbr != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.abbr = childRecord.value;
        break;
      case "TEXT":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (gedcomSource.text != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.text = childRecord.value;
        break;
      case "TITL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (gedcomSource.title != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomSource.title = childRecord.value;
        break;
      case "REPO":
        gedcomSource.repositoryCitations.push(
          parseGedcomSourceRepositoryCitation(childRecord)
        );
        break;
      case "OBJE":
        gedcomSource.multimediaLinks.push(
          parseGedcomSourceMultimediaLink(childRecord)
        );
        break;
      default:
        gedcomSource.unknownRecords.push(childRecord);
        break;
    }
  }

  return gedcomSource;
}

function parseGedcomSourceRepositoryCitation(gedcomRecord: GedcomRecord) {
  if (gedcomRecord.abstag !== "SOUR.REPO") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const repositoryXref = gedcomRecord.value;
  const callNumbers: string[] = [];

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "CALN":
        if (childRecord.abstag != "SOUR.REPO.CALN") throw new Error();
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (childRecord.children.length > 0) throw new Error();
        callNumbers.push(childRecord.value);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return { repositoryXref, callNumbers };
}

function parseGedcomSourceMultimediaLink(gedcomRecord: GedcomRecord): {
  multimediaXref: string;
  title?: string;
} {
  if (gedcomRecord.abstag !== "SOUR.OBJE") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
    }
  }

  return { multimediaXref: gedcomRecord.value };
}

export function serializeGedcomSource(source: GedcomSource): GedcomRecord {
  return {
    xref: source.xref,
    tag: "SOUR",
    abstag: "SOUR",
    children: [
      { tag: "ABBR", abstag: "SOUR.ABBR", value: source.abbr, children: [] },
      { tag: "TITL", abstag: "SOUR.TITL", value: source.title, children: [] },
      ...source.unknownRecords.filter((record) => record.tag == "_SUBQ"),
      ...source.unknownRecords.filter((record) => record.tag == "_BIBL"),
      { tag: "TEXT", abstag: "SOUR.TEXT", value: source.text, children: [] },
      ...source.repositoryCitations.map((repositoryCitation) => ({
        tag: "REPO",
        abstag: "SOUR.REPO",
        value: repositoryCitation.repositoryXref,
        children: repositoryCitation.callNumbers.map((callNumber) => ({
          tag: "CALN",
          abstag: "SOUR.REPO.CALN",
          value: callNumber,
          children: [],
        })),
      })),
      ...source.unknownRecords.filter(
        (record) => record.tag != "_SUBQ" && record.tag != "_BIBL"
      ),
    ].filter((record) => record.children.length || record.value),
  };
}
