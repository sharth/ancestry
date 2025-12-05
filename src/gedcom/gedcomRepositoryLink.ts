import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomRepositoryLink {
  repositoryXref: string;
  callNumber: string;
}

export function parseGedcomRepositoryLink(
  gedcomRecord: GedcomRecord,
): GedcomRepositoryLink {
  if (gedcomRecord.tag !== "REPO") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const repositoryLink: GedcomRepositoryLink = {
    repositoryXref: gedcomRecord.value,
    callNumber: "",
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "CALN":
        if (childRecord.abstag != "SOUR.REPO.CALN") throw new Error();
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length > 0) throw new Error();
        repositoryLink.callNumber = childRecord.value;
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
    xref: "",
    value: repositoryLink.repositoryXref,
    children: [
      {
        tag: "CALN",
        abstag: "SOUR.REPO.CALN",
        xref: "",
        value: repositoryLink.callNumber,
        children: [],
      },
    ].filter((r) => r.value || r.children.length > 0),
  };
}
