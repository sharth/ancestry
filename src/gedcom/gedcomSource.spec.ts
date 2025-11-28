import { type GedcomRecord, parseGedcomRecords } from "./gedcomRecord";
import type { GedcomSource } from "./gedcomSource";
import { parseGedcomSource, serializeGedcomSource } from "./gedcomSource";
import { describe, expect, it } from "vitest";

describe("GedcomSource", () => {
  it("no fields", () => {
    const gedcomRecord: GedcomRecord = {
      tag: "SOUR",
      abstag: "SOUR",
      xref: "@S1@",
      children: [],
    };
    const gedcomSource: GedcomSource = {
      xref: "@S1@",
      abbr: "",
      title: "",
      text: "",
      repositoryLinks: [],
      unknownRecords: [],
      multimediaLinks: [],
    };
    expect(parseGedcomSource(gedcomRecord)).toEqual(gedcomSource);
    expect(serializeGedcomSource(parseGedcomSource(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });

  it("with details", () => {
    const gedcomText = [
      "0 @S2@ SOUR",
      "1 ABBR abbr",
      "1 TITL title",
      "1 TEXT text and more text",
      "1 _TMPLT",
      "2 TID 72",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    expect(parseGedcomSource(gedcomRecord)).toEqual({
      xref: "@S2@",
      abbr: "abbr",
      title: "title",
      text: "text and more text",
      multimediaLinks: [],
      repositoryLinks: [],
      unknownRecords: [
        {
          tag: "_TMPLT",
          abstag: "SOUR._TMPLT",
          xref: undefined,
          value: undefined,
          children: [
            {
              tag: "TID",
              abstag: "SOUR._TMPLT.TID",
              xref: undefined,
              value: "72",
              children: [],
            },
          ],
        },
      ],
    });
  });
});
