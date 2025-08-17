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
  if (gedcomRecord.xref != null) throw new Error();

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
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        prefixes.push(childRecord.value);
        break;
      case "GIVN":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        givenNames.push(childRecord.value);
        break;
      case "NICK":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        nickNames.push(childRecord.value);
        break;
      case "SPFX":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        surnamePrefixes.push(childRecord.value);
        break;
      case "SURN":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        surnames.push(childRecord.value);
        break;
      case "NSFX":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        suffixes.push(childRecord.value);
        break;
      case "SOUR":
        citations.push(parseGedcomCitation(childRecord));
        break;
      case "TYPE":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
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
    value: [
      // name.prefix,
      name.givenName,
      // name.nickName,
      // name.surnamePrefix,
      name.surname ? `/${name.surname}/` : "//",
      // name.suffix,
    ]
      .filter((part) => part != undefined)
      .filter((part) => part != "")
      .join(" "),
    children: [
      {
        tag: "NPFX",
        abstag: "INDI.NAME.NPFX",
        value: name.prefix,
        children: [],
      },
      {
        tag: "GIVN",
        abstag: "INDI.NAME.GIVN",
        value: name.givenName,
        children: [],
      },
      {
        tag: "SPFX",
        abstag: "INDI.NAME.SPFX",
        value: name.surnamePrefix,
        children: [],
      },
      {
        tag: "SURN",
        abstag: "INDI.NAME.SURN",
        value: name.surname,
        children: [],
      },
      {
        tag: "NSFX",
        abstag: "INDI.NAME.NSFX",
        value: name.suffix,
        children: [],
      },
      {
        tag: "NICK",
        abstag: "INDI.NAME.NICK",
        value: name.nickName,
        children: [],
      },
      {
        tag: "TYPE",
        abstag: "INDI.NAME.TYPE",
        value: name.nameType,
        children: [],
      },
      ...name.notes.map((n) => serializeGedcomNote(n)),
      ...name.citations.map((citation) => serializeGedcomCitation(citation)),
    ].filter((record) => record.children.length || record.value),
  };
}
