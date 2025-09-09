import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomRepositoryLink {
  repositoryXref: string;
  callNumbers: string[];
}

export function parseGedcomRepositoryLink(
  gedcomRecord: GedcomRecord,
): GedcomRepositoryLink {
  if (gedcomRecord.tag !== "REPO") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const repositoryLink: GedcomRepositoryLink = {
    repositoryXref: gedcomRecord.value,
    callNumbers: [],
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "CALN":
        if (childRecord.abstag != "SOUR.REPO.CALN") throw new Error();
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (childRecord.children.length > 0) throw new Error();
        repositoryLink.callNumbers.push(childRecord.value);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return repositoryLink;
}

export function serializeGedcomRepositoryLink(
  repositoryLink: GedcomRepositoryLink,
): GedcomRecord {
  return {
    tag: "REPO",
    abstag: "",
    value: repositoryLink.repositoryXref,
    children: repositoryLink.callNumbers.map((callNumber) => ({
      tag: "CALN",
      abstag: "SOUR.REPO.CALN",
      value: callNumber,
      children: [],
    })),
  };
}
