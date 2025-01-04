import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { parseGedcomEvent } from "./gedcomEventParser";
import type { GedcomFamily } from "./gedcomFamily";
import type { GedcomRecord } from "./gedcomRecord";

export function parseGedcomFamily(record: GedcomRecord): GedcomFamily {
  if (record.abstag !== "FAM") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomFamily: GedcomFamily = {
    xref: record.xref,
    gedcomRecord: record,
    childXrefs: [],
    events: [],
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
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}
