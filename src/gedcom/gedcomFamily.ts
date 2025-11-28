import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomCitation } from "./gedcomCitation";
import { parseGedcomCitation, serializeGedcomCitation } from "./gedcomCitation";
import type { GedcomEvent } from "./gedcomEvent";
import { parseGedcomEvent } from "./gedcomEvent";
import { serializeGedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomFamily {
  xref: string;
  husbandXref: string;
  wifeXref: string;
  childXrefs: string[];
  events: GedcomEvent[];
  citations: GedcomCitation[];
}

export function parseGedcomFamily(record: GedcomRecord): GedcomFamily {
  if (record.abstag !== "FAM") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomFamily: GedcomFamily = {
    xref: record.xref,
    husbandXref: "",
    wifeXref: "",
    childXrefs: [],
    events: [],
    citations: [],
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "CHIL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.childXrefs.push(childRecord.value);
        break;
      case "HUSB":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.husbandXref = childRecord.value;
        break;
      case "WIFE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.wifeXref = childRecord.value;
        break;
      case "DIV":
      case "EVEN":
      case "MARR":
      case "MARB":
        gedcomFamily.events.push(parseGedcomEvent(childRecord));
        break;
      case "SOUR":
        gedcomFamily.citations.push(parseGedcomCitation(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}

export function serializeGedcomFamily(
  gedcomFamily: GedcomFamily,
): GedcomRecord {
  return {
    xref: gedcomFamily.xref,
    tag: "FAM",
    abstag: "FAM",
    children: [
      {
        tag: "HUSB",
        abstag: "FAM.HUSB",
        value: gedcomFamily.husbandXref,
        children: [],
      },
      {
        tag: "WIFE",
        abstag: "FAM.WIFE",
        value: gedcomFamily.wifeXref,
        children: [],
      },
      ...gedcomFamily.childXrefs.map((childXref) => ({
        tag: "CHIL",
        abstag: "FAM.CHIL",
        value: childXref,
        children: [],
      })),
      ...gedcomFamily.citations.map((citation) =>
        serializeGedcomCitation(citation),
      ),
      ...gedcomFamily.events.map((event) => serializeGedcomEvent(event)),
    ].filter((record) => record.children.length || record.value),
  };
}
