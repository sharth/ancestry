import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomMultimediaLink } from "./gedcomMultimediaLink";
import {
  parseGedcomMultimediaLink,
  serializeGedcomMultimediaLink,
} from "./gedcomMultimediaLink";
import type { GedcomNote } from "./gedcomNote";
import { parseGedcomNote, serializeGedcomNote } from "./gedcomNote";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomSourceCitation {
  sourceXref: string;
  notes: GedcomNote[];
  text: string;
  page: string;
  quality: string;
  multimediaLinks: GedcomMultimediaLink[];
}

export function parseGedcomSourceCitation(
  gedcomRecord: GedcomRecord,
): GedcomSourceCitation {
  if (gedcomRecord.tag !== "SOUR") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const gedcomCitation: GedcomSourceCitation = {
    sourceXref: gedcomRecord.value,
    text: "",
    page: "",
    quality: "",
    notes: [],
    multimediaLinks: [],
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "QUAY":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.quality = childRecord.value;
        break;
      case "OBJE":
        gedcomCitation.multimediaLinks.push(
          parseGedcomMultimediaLink(childRecord),
        );
        break;
      case "NOTE":
        gedcomCitation.notes.push(parseGedcomNote(childRecord));
        break;
      case "PAGE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.page = childRecord.value;
        break;
      case "DATA":
        gedcomCitation.text = parseGedcomSourceCitationData(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}

function parseGedcomSourceCitationData(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag != "DATA") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value != "") throw new Error();

  let text = "";

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "TEXT":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (childRecord.children.length) throw new Error();
        text = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
    }
  }

  return text;
}

export function serializeGedcomSourceCitation(
  gedcomCitation: GedcomSourceCitation,
): GedcomRecord {
  return {
    tag: "SOUR",
    abstag: "",
    xref: "",
    value: gedcomCitation.sourceXref,
    children: [
      ...gedcomCitation.multimediaLinks.map((gedcomMultimediaLink) =>
        serializeGedcomMultimediaLink(gedcomMultimediaLink),
      ),
      {
        tag: "PAGE",
        abstag: "",
        xref: "",
        value: gedcomCitation.page,
        children: [],
      },
      ...gedcomCitation.notes.map((gedcomNote) =>
        serializeGedcomNote(gedcomNote),
      ),
      {
        tag: "QUAY",
        abstag: "",
        xref: "",
        value: gedcomCitation.quality,
        children: [],
      },
      {
        tag: "DATA",
        abstag: "",
        xref: "",
        value: "",
        children: [
          {
            tag: "TEXT",
            abstag: "",
            xref: "",
            value: gedcomCitation.text,
            children: [],
          },
        ].filter((record) => record.children.length || record.value),
      },
    ].filter((record) => record.children.length || record.value),
  };
}
