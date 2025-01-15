import { serializeGedcomCitation } from "./gedcomCitationSerializer";
import type { GedcomName } from "./gedcomName";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomName(name: GedcomName): GedcomRecord {
  return {
    tag: "NAME",
    abstag: "INDI.NAME",
    value: [
      name.prefix,
      name.givenName,
      name.nickName,
      name.surnamePrefix,
      name.surname ? `/${name.surname}/` : undefined,
      name.suffix,
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
        tag: "NICK",
        abstag: "INDI.NAME.NICK",
        value: name.nickName,
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
        tag: "TYPE",
        abstag: "INDI.NAME.TYPE",
        value: name.nameType,
        children: [],
      },
      ...name.citations.map((citation) => serializeGedcomCitation(citation)),
    ].filter((record) => record.children.length || record.value),
  };
}
