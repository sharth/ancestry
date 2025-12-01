import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomCitation } from "./gedcomCitation";
import { parseGedcomCitation } from "./gedcomCitation";
import { serializeGedcomCitation } from "./gedcomCitation";
import {
  type GedcomNote,
  parseGedcomNote,
  serializeGedcomNote,
} from "./gedcomNote";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomName {
  prefix?: string;
  givenName?: string;
  nickName?: string;
  surnamePrefix?: string;
  surname?: string;
  suffix?: string;
  nameType?: string;
  citations: GedcomCitation[];
  notes: GedcomNote[];
}

export function parseGedcomName(gedcomRecord: GedcomRecord): GedcomName {
  if (gedcomRecord.abstag !== "INDI.NAME") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();

  const prefixes: string[] = [];
  const givenNames: string[] = [];
  const nickNames: string[] = [];
  const surnamePrefixes: string[] = [];
  const surnames: string[] = [];
  const suffixes: string[] = [];
  const citations: GedcomCitation[] = [];
  const notes: GedcomNote[] = [];
  let nameType: string | undefined = undefined;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NPFX":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        prefixes.push(childRecord.value);
        break;
      case "GIVN":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        givenNames.push(childRecord.value);
        break;
      case "NICK":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        nickNames.push(childRecord.value);
        break;
      case "SPFX":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        surnamePrefixes.push(childRecord.value);
        break;
      case "SURN":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        surnames.push(childRecord.value);
        break;
      case "NSFX":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        suffixes.push(childRecord.value);
        break;
      case "SOUR":
        citations.push(parseGedcomCitation(childRecord));
        break;
      case "TYPE":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        if (nameType != null) throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        nameType = childRecord.value;
        break;
      case "NOTE":
        notes.push(parseGedcomNote(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  if (
    gedcomRecord.value &&
    prefixes.length == 0 &&
    givenNames.length == 0 &&
    nickNames.length == 0 &&
    surnamePrefixes.length == 0 &&
    surnames.length == 0 &&
    suffixes.length == 0
  ) {
    const match = new RegExp(`(.*)/(.*)/(.*)`).exec(gedcomRecord.value);
    if (match) {
      if (match[1]) givenNames.push(match[1]);
      if (match[2]) surnames.push(match[2]);
      if (match[3]) suffixes.push(match[3]);
    } else {
      givenNames.push(gedcomRecord.value);
    }
  }

  return {
    prefix: prefixes.join(" ") || undefined,
    givenName: givenNames.join(" ") || undefined,
    nickName: nickNames.join(" ") || undefined,
    surnamePrefix: surnamePrefixes.join(" ") || undefined,
    surname: surnames.join(" ") || undefined,
    suffix: suffixes.join(" ") || undefined,
    nameType,
    citations,
    notes,
  };
}

export function serializeGedcomName(name: GedcomName): GedcomRecord {
  return {
    tag: "NAME",
    abstag: "INDI.NAME",
    xref: "",
    value: displayGedcomName(name),
    children: [
      {
        tag: "NPFX",
        abstag: "INDI.NAME.NPFX",
        xref: "",
        value: name.prefix ?? "",
        children: [],
      },
      {
        tag: "GIVN",
        abstag: "INDI.NAME.GIVN",
        xref: "",
        value: name.givenName ?? "",
        children: [],
      },
      {
        tag: "SPFX",
        abstag: "INDI.NAME.SPFX",
        xref: "",
        value: name.surnamePrefix ?? "",
        children: [],
      },
      {
        tag: "SURN",
        abstag: "INDI.NAME.SURN",
        xref: "",
        value: name.surname ?? "",
        children: [],
      },
      {
        tag: "NSFX",
        abstag: "INDI.NAME.NSFX",
        xref: "",
        value: name.suffix ?? "",
        children: [],
      },
      {
        tag: "NICK",
        abstag: "INDI.NAME.NICK",
        xref: "",
        value: name.nickName ?? "",
        children: [],
      },
      {
        tag: "TYPE",
        abstag: "INDI.NAME.TYPE",
        xref: "",
        value: name.nameType ?? "",
        children: [],
      },
      ...name.notes.map((n) => serializeGedcomNote(n)),
      ...name.citations.map((citation) => serializeGedcomCitation(citation)),
    ].filter((record) => record.children.length || record.value),
  };
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
    .filter((part) => part != undefined)
    .filter((part) => part != "")
    .join(" ");
}
