import * as gedcom from "../gedcom";
import { assert } from "chai";
import { parseGedcomRecords } from "./gedcom-lexer";

describe("GedcomRecord Parsing", () => {
  it("conc is merged into the previous record", () => {
    const gedcomText = [
      "0 @I1@ INDI",
      "1 NAME john ",
      "2 CONC doe",
      "2 CONT senior",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord("@I1@", "INDI", "INDI", undefined, [
        new gedcom.GedcomRecord(
          undefined,
          "NAME",
          "INDI.NAME",
          "john doe\nsenior",
          []
        ),
      ])
    );
  });

  it("conc onto the empty string", () => {
    const gedcomText = ["0 TAG", "1 CONC value"];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(undefined, "TAG", "TAG", "value", [])
    );
  });

  it("cont onto the empty string", () => {
    const gedcomText = ["0 TAG", "1 CONT value"];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(undefined, "TAG", "TAG", "\nvalue", [])
    );
  });

  it("empty lines presented correctly", () => {
    const gedcomText = ["0 TAG", "1 CONC", "1 CONT", "1 CONT"];
    const gedcomRecords = parseGedcomRecords(gedcomText.join("\n"));
    assert.deepEqual(gedcomRecords, [
      new gedcom.GedcomRecord(undefined, "TAG", "TAG", "\n\n", []),
    ]);
  });

  it("conc records disappear", () => {
    const gedcomText = ["0 TAG abc", "1 CONC def"];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.deepEqual(
      gedcomRecord,
      new gedcom.GedcomRecord(undefined, "TAG", "TAG", "abcdef", [])
    );
  });
});
