import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomMultimediaLink } from "./gedcomMultimediaLink";
import {
  parseGedcomMultimediaLink,
  serializeGedcomMultimediaLink,
} from "./gedcomMultimediaLink";
import type { GedcomNote } from "./gedcomNote";
import { parseGedcomNote, serializeGedcomNote } from "./gedcomNote";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomCitation {
  sourceXref: string;
  notes: GedcomNote[];
  text: string;
  page: string;
  quality: string;
  multimediaLinks: GedcomMultimediaLink[];
}

export function parseGedcomCitation(
  gedcomRecord: GedcomRecord,
): GedcomCitation {
  if (gedcomRecord.tag !== "SOUR") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomCitation: GedcomCitation = {
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
        gedcomCitation.quality = childRecord.value ?? "";
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
        gedcomCitation.page = childRecord.value ?? "";
        break;
      case "DATA":
        gedcomCitation.text = parseGedcomCitationData(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}

function parseGedcomCitationData(gedcomRecord: GedcomRecord): string {
  if (gedcomRecord.tag != "DATA") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  let text = "";

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "TEXT":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        if (childRecord.children.length) throw new Error();
        text = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
    }
  }

  return text;
}

export function serializeGedcomCitation(
  gedcomCitation: GedcomCitation,
): GedcomRecord {
  return {
    tag: "SOUR",
    abstag: "",
    value: gedcomCitation.sourceXref,
    children: [
      ...gedcomCitation.multimediaLinks.map((gedcomMultimediaLink) =>
        serializeGedcomMultimediaLink(gedcomMultimediaLink),
      ),
      { tag: "PAGE", abstag: "", value: gedcomCitation.page, children: [] },
      ...gedcomCitation.notes.map((gedcomNote) =>
        serializeGedcomNote(gedcomNote),
      ),
      { tag: "QUAY", abstag: "", value: gedcomCitation.quality, children: [] },
      {
        tag: "DATA",
        abstag: "",
        value: undefined,
        children: [
          { tag: "TEXT", abstag: "", value: gedcomCitation.text, children: [] },
        ].filter((record) => record.children.length || record.value),
      },
    ].filter((record) => record.children.length || record.value),
  };
}
