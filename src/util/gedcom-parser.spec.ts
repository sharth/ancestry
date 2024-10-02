import { assert } from "chai";
import {
  parseGedcomFamily,
  parseGedcomIndividual,
  parseGedcomSource,
} from "./gedcom-parser";
import { parseGedcomRecords } from "./gedcom-lexer";
import { GedcomRecord } from "../gedcom";

describe("GedcomFamily", () => {
  it("No Parents", () => {
    const [gedcomRecord] = parseGedcomRecords(["0 @F1@ FAM"].join("\n"));
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomFamily,
        gedcomRecord: undefined,
      },
      {
        xref: "@F1@",
        childXrefs: [],
        events: [],
        gedcomRecord: undefined,
      }
    );
  });

  it("Parents", () => {
    const [gedcomRecord] = parseGedcomRecords(
      ["0 @F3@ FAM", "1 WIFE @I2@", "1 HUSB @I3@"].join("\n")
    );
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomFamily,
        gedcomRecord: undefined,
      },
      {
        xref: "@F3@",
        wifeXref: "@I2@",
        husbandXref: "@I3@",
        childXrefs: [],
        events: [],
        gedcomRecord: undefined,
      }
    );
  });
});

describe("GedcomIndividual", () => {
  it("No Fields", () => {
    const [gedcomRecord] = parseGedcomRecords(["0 @I1@ INDI"].join("\n"));
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomIndividual,
        gedcomRecord: undefined,
      },
      {
        xref: "@I1@",
        events: [],
        gedcomRecord: undefined,
      }
    );
  });

  it("Male", () => {
    const [gedcomRecord] = parseGedcomRecords(
      ["0 @I1@ INDI", "1 SEX M"].join("\n")
    );
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomIndividual,
        gedcomRecord: undefined,
      },
      {
        xref: "@I1@",
        sex: "Male",
        events: [
          { type: "Sex", citations: [], sharedWithXrefs: [], value: "M" },
        ],
        gedcomRecord: undefined,
      }
    );
  });

  it("Female", () => {
    const [gedcomRecord] = parseGedcomRecords(
      ["0 @I1@ INDI", "1 SEX F"].join("\n")
    );
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomIndividual,
        gedcomRecord: undefined,
      },
      {
        xref: "@I1@",
        sex: "Female",
        events: [
          { type: "Sex", citations: [], sharedWithXrefs: [], value: "F" },
        ],
        gedcomRecord: undefined,
      }
    );
  });

  it("Family Search Id", () => {
    const [gedcomRecord] = parseGedcomRecords(
      ["0 @I4@ INDI", "1 _FSFTID abcd"].join("\n")
    );
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomIndividual,
        gedcomRecord: undefined,
      },
      {
        xref: "@I4@",
        familySearchId: "abcd",
        events: [],
        gedcomRecord: undefined,
      }
    );
  });
});

describe("GedcomSource", () => {
  it("No Fields", () => {
    const gedcomText = "0 @S1@ SOUR\n";
    const [gedcomRecord] = parseGedcomRecords(gedcomText);
    const gedcomSource = parseGedcomSource(gedcomRecord);
    assert.deepEqual(
      {
        ...gedcomSource,
        canonicalGedcomRecord: undefined,
      },
      {
        xref: "@S1@",
        repositoryCitations: [],
        unknownRecords: [],
        multimediaXrefs: [],
        canonicalGedcomRecord: undefined,
      }
    );
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
    assert.deepEqual(
      {
        ...gedcomSource,
        canonicalGedcomRecord: undefined,
      },
      {
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
        multimediaXrefs: [],
        canonicalGedcomRecord: undefined,
      }
    );
  });
});
