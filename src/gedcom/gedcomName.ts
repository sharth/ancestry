import type { Immutable } from "immer";

import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomNote,
  serializeGedcomNote,
  type GedcomNote,
} from "./gedcomNote";
import {
  filterTrivialGedcomRecord,
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  parseGedcomSourceCitation,
  serializeGedcomSourceCitation,
  type GedcomSourceCitation,
} from "./gedcomSourceCitation";

export interface GedcomName {
  prefix: string;
  givenName: string;
  nickName: string;
  surnamePrefix: string;
  surname: string;
  suffix: string;
  nameType: string;
  citations: GedcomSourceCitation[];
  notes: GedcomNote[];
}

export function newGedcomName(
  fieldsToUpdate: Partial<GedcomName> = {},
): GedcomName {
  return {
    prefix: "",
    givenName: "",
    nickName: "",
    surnamePrefix: "",
    surname: "",
    suffix: "",
    nameType: "",
    citations: [],
    notes: [],
    ...fieldsToUpdate,
  };
}

export function parseGedcomName(gedcomRecord: GedcomRecord): GedcomName {
  if (gedcomRecord.tag !== "NAME") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();

  const gedcomName = newGedcomName();

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NPFX":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomName.prefix = childRecord.value;
        break;
      case "GIVN":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomName.givenName = childRecord.value;
        break;
      case "NICK":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomName.nickName = childRecord.value;
        break;
      case "SPFX":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomName.surnamePrefix = childRecord.value;
        break;
      case "SURN":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomName.surname = childRecord.value;
        break;
      case "NSFX":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        gedcomName.suffix = childRecord.value;
        break;
      case "SOUR":
        gedcomName.citations.push(parseGedcomSourceCitation(childRecord));
        break;
      case "TYPE":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomName.nameType = childRecord.value;
        break;
      case "NOTE":
        gedcomName.notes.push(parseGedcomNote(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomName;
}

export function serializeGedcomName(
  name: Immutable<GedcomName>,
): Immutable<GedcomRecord> | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "NAME",
      value: displayGedcomName(name),
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "NPFX",
          value: name.prefix,
        }),
        newGedcomRecord({
          tag: "GIVN",
          value: name.givenName,
        }),
        newGedcomRecord({
          tag: "SPFX",
          value: name.surnamePrefix,
        }),
        newGedcomRecord({
          tag: "SURN",
          value: name.surname,
        }),
        newGedcomRecord({
          tag: "NSFX",
          value: name.suffix,
        }),
        newGedcomRecord({
          tag: "NICK",
          value: name.nickName,
        }),
        newGedcomRecord({
          tag: "TYPE",
          value: name.nameType,
        }),
        ...name.notes.map((n) => serializeGedcomNote(n)),
        ...name.citations.map((citation) =>
          serializeGedcomSourceCitation(citation),
        ),
      ]),
    }),
  );
}

export function displayGedcomName(gedcomName: Immutable<GedcomName>) {
  const name = [
    // gedcomName.prefix,
    gedcomName.givenName,
    // gedcomName.nickName,
    // gedcomName.surnamePrefix,
    gedcomName.surname ? `/${gedcomName.surname}/` : "//",
    // gedcomName.suffix,
  ]
    .filter((part) => part != "")
    .join(" ");
  return name === "//" ? "" : name;
}
