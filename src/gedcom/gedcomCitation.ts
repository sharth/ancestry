import type { GedcomRecord } from "./gedcomRecord";
import { reportUnparsedRecord } from "../util/record-unparsed-records";

export interface GedcomCitation {
  sourceXref: string;
  name?: string;
  obje?: string;
  note?: string;
  text?: string;
  page?: string;
  quality?: string;
}

export function parseGedcomCitation(
  gedcomRecord: GedcomRecord
): GedcomCitation {
  if (gedcomRecord.tag !== "SOUR") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomCitation: GedcomCitation = {
    sourceXref: gedcomRecord.value,
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "_TMPLT":
      case "_QUAL":
        break;
      case "QUAY":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.quality = childRecord.value;
        break;
      case "OBJE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.obje = childRecord.value;
        break;
      case "NAME":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.name = childRecord.value;
        break;
      case "NOTE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.note = childRecord.value;
        break;
      case "PAGE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.page = childRecord.value;
        break;
      case "DATA":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value != null) throw new Error();
        for (const grandchildRecord of childRecord.children) {
          switch (grandchildRecord.tag) {
            case "TEXT":
              if (grandchildRecord.xref != null) throw new Error();
              if (grandchildRecord.value != null) {
                gedcomCitation.text = grandchildRecord.value;
              }
              break;
            default:
              reportUnparsedRecord(grandchildRecord);
          }
        }
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}

export function serializeGedcomCitation(
  gedcomCitation: GedcomCitation
): GedcomRecord {
  return {
    tag: "SOUR",
    abstag: "",
    value: gedcomCitation.sourceXref,
    children: [
      { tag: "OBJE", abstag: "", value: gedcomCitation.obje, children: [] },
      { tag: "PAGE", abstag: "", value: gedcomCitation.page, children: [] },
      { tag: "NAME", abstag: "", value: gedcomCitation.name, children: [] },
      { tag: "NOTE", abstag: "", value: gedcomCitation.note, children: [] },
      { tag: "QUAY", abstag: "", value: gedcomCitation.quality, children: [] },
      {
        tag: "DATA",
        abstag: "",
        children: [
          { tag: "TEXT", abstag: "", value: gedcomCitation.text, children: [] },
        ].filter((record) => record.children.length || record.value),
      },
    ].filter((record) => record.children.length || record.value),
  };
}
