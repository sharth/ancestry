import { parseGedcomRecords } from "./gedcomRecordParser";
import { GedcomRecord } from "./gedcomRecord";
import { parseGedcomSource } from "./gedcomSourceParser";

it("No Fields", () => {
  const gedcomText = "0 @S1@ SOUR\n";
  const [gedcomRecord] = parseGedcomRecords(gedcomText);
  const gedcomSource = parseGedcomSource(gedcomRecord);
  expect({
    ...gedcomSource,
    canonicalGedcomRecord: undefined,
  }).toEqual({
    xref: "@S1@",
    repositoryCitations: [],
    unknownRecords: [],
    multimediaLinks: [],
    canonicalGedcomRecord: undefined,
  });
});

it("Test some fields", () => {
  const gedcomText = [
    "0 @S10@ SOUR",
    "1 ABBR abbr",
    "1 TITL title",
    "1 _TMPLT",
    "2 TID 72",
    "1 TEXT text ",
    "2 CONC and more text",
  ].join("\n");
  const [gedcomRecord] = parseGedcomRecords(gedcomText);
  const gedcomSource = parseGedcomSource(gedcomRecord);
  expect({
    ...gedcomSource,
    canonicalGedcomRecord: undefined,
  }).toEqual({
    xref: "@S10@",
    abbr: "abbr",
    title: "title",
    text: "text and more text",
    repositoryCitations: [],
    unknownRecords: [
      new GedcomRecord(undefined, "_TMPLT", "SOUR._TMPLT", undefined, [
        new GedcomRecord(undefined, "TID", "SOUR._TMPLT.TID", "72", []),
      ]),
    ],
    multimediaLinks: [],
    canonicalGedcomRecord: undefined,
  });
});
