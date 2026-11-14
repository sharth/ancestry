import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { newGedcomRecord, type GedcomRecord } from "./gedcomRecord";

// An EXID: an identifier for the subject of a record, maintained by an
// external authority (GEDCOM 7.0 IDENTIFIER_STRUCTURE). The authority is a URI
// in TYPE, e.g. https://gedcom.io/exid-type/FamilySearch-PersonId.
export interface GedcomExternalIdentifier {
  id: string;
  type: string;
}

export function newGedcomExternalIdentifier(
  fieldsToUpdate: Partial<GedcomExternalIdentifier> = {},
): GedcomExternalIdentifier {
  return {
    id: "",
    type: "",
    ...fieldsToUpdate,
  };
}

export function parseGedcomExternalIdentifier(
  gedcomRecord: GedcomRecord,
): GedcomExternalIdentifier {
  if (gedcomRecord.tag !== "EXID") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const externalIdentifier = newGedcomExternalIdentifier({
    id: gedcomRecord.value,
  });

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "TYPE":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        externalIdentifier.type = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return externalIdentifier;
}

export function serializeGedcomExternalIdentifier(
  externalIdentifier: GedcomExternalIdentifier,
): GedcomRecord {
  return newGedcomRecord({
    tag: "EXID",
    value: externalIdentifier.id,
    children: externalIdentifier.type
      ? [newGedcomRecord({ tag: "TYPE", value: externalIdentifier.type })]
      : [],
  });
}
