import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomMultimediaLink {
  xref: string;
  title: string;
}

export function parseGedcomMultimediaLink(
  record: GedcomRecord,
): GedcomMultimediaLink {
  if (record.tag !== "OBJE") throw new Error();
  if (record.xref != "") throw new Error();
  if (record.value == "") throw new Error();

  const gedcomMultimediaLink: GedcomMultimediaLink = {
    xref: record.value,
    title: "",
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "TITL":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length) throw new Error();
        if (gedcomMultimediaLink.title !== "") throw new Error();

        gedcomMultimediaLink.title = childRecord.value;
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomMultimediaLink;
}

export function serializeGedcomMultimediaLink(
  gedcomMultimediaLink: GedcomMultimediaLink,
): GedcomRecord {
  return {
    tag: "OBJE",
    abstag: "",
    xref: "",
    value: gedcomMultimediaLink.xref,
    children: [
      {
        tag: "TITL",
        abstag: "",
        xref: "",
        value: gedcomMultimediaLink.title,
        children: [],
      },
    ].filter((record) => record.value || record.children.length),
  };
}
