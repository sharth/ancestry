import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomNote } from "./gedcomNote";
import { parseGedcomNote, serializeGedcomNote } from "./gedcomNote";
import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomSourceCitation } from "./gedcomSourceCitation";
import { parseGedcomSourceCitation } from "./gedcomSourceCitation";
import { serializeGedcomSourceCitation } from "./gedcomSourceCitation";

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

export function parseGedcomName(gedcomRecord: GedcomRecord): GedcomName {
  if (gedcomRecord.tag !== "NAME") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();

  const gedcomName: GedcomName = {
    prefix: "",
    givenName: "",
    nickName: "",
    surnamePrefix: "",
    surname: "",
    suffix: "",
    nameType: "",
    citations: [],
    notes: [],
  };

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

export function serializeGedcomName(name: GedcomName): GedcomRecord | null {
  const gedcomRecord: GedcomRecord = {
    tag: "NAME",
    abstag: "INDI.NAME",
    xref: "",
    value: displayGedcomName(name),
    children: [
      {
        tag: "NPFX",
        abstag: "INDI.NAME.NPFX",
        xref: "",
        value: name.prefix,
        children: [],
      },
      {
        tag: "GIVN",
        abstag: "INDI.NAME.GIVN",
        xref: "",
        value: name.givenName,
        children: [],
      },
      {
        tag: "SPFX",
        abstag: "INDI.NAME.SPFX",
        xref: "",
        value: name.surnamePrefix,
        children: [],
      },
      {
        tag: "SURN",
        abstag: "INDI.NAME.SURN",
        xref: "",
        value: name.surname,
        children: [],
      },
      {
        tag: "NSFX",
        abstag: "INDI.NAME.NSFX",
        xref: "",
        value: name.suffix,
        children: [],
      },
      {
        tag: "NICK",
        abstag: "INDI.NAME.NICK",
        xref: "",
        value: name.nickName,
        children: [],
      },
      {
        tag: "TYPE",
        abstag: "INDI.NAME.TYPE",
        xref: "",
        value: name.nameType,
        children: [],
      },
      ...name.notes.map((n) => serializeGedcomNote(n)),
      ...name.citations.map((citation) =>
        serializeGedcomSourceCitation(citation),
      ),
    ].filter((record) => record.children.length || record.value),
  };
  if (
    gedcomRecord.xref ||
    gedcomRecord.value != "//" ||
    gedcomRecord.children.length
  ) {
    return gedcomRecord;
  } else {
    return null;
  }
}

export function displayGedcomName(gedcomName: GedcomName) {
  return [
    // gedcomName.prefix,
    gedcomName.givenName,
    // gedcomName.nickName,
    // gedcomName.surnamePrefix,
    gedcomName.surname ? `/${gedcomName.surname}/` : "//",
    // gedcomName.suffix,
  ]
    .filter((part) => part != "")
    .join(" ");
}
