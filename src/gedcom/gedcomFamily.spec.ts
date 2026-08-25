import { assert, describe, expect, it } from "vitest";
import { newGedcomFact } from "./gedcomFact";
import {
  newGedcomFamily,
  parseGedcomFamily,
  serializeGedcomFamily,
} from "./gedcomFamily";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";

describe("gedcomFamily", () => {
  it("parse family with husband, no wife and two children", () => {
    const gedcomText = [
      "0 @F1@ FAM", //
      "1 HUSB @I1@",
      "1 CHIL @I10@",
      "1 CHIL @I11@",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F1@",
        husbandXref: "@I1@",
        childXrefs: ["@I10@", "@I11@"],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  it("parse family with no husband, no wife and no children", () => {
    const gedcomText = [
      "0 @F2@ FAM", //
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F2@",
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  it("parse family with husband, wife and no children", () => {
    const gedcomText = [
      "0 @F3@ FAM", //
      "1 HUSB @I3@",
      "1 WIFE @I2@",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F3@",
        husbandXref: "@I3@",
        wifeXref: "@I2@",
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  it("all family events and attributes are recognized facts", () => {
    const gedcomText = [
      "0 @F4@ FAM",
      // Attributes (mandatory value)
      "1 NCHI value",
      "1 RESI value",
      "1 FACT value",
      "2 TYPE type",
      // Events (boolean, use Y marker)
      "1 ANUL Y",
      "1 CENS Y",
      "1 DIV Y",
      "1 DIVF Y",
      "1 ENGA Y",
      "1 MARB Y",
      "1 MARC Y",
      "1 MARL Y",
      "1 MARR Y",
      "1 MARS Y",
      "1 EVEN value",
      "2 TYPE type",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F4@",
        facts: [
          newGedcomFact({ tag: "NCHI", value: "value" }),
          newGedcomFact({ tag: "RESI", value: "value" }),
          newGedcomFact({ tag: "FACT", value: "value", type: "type" }),
          newGedcomFact({ tag: "ANUL" }),
          newGedcomFact({ tag: "CENS" }),
          newGedcomFact({ tag: "DIV" }),
          newGedcomFact({ tag: "DIVF" }),
          newGedcomFact({ tag: "ENGA" }),
          newGedcomFact({ tag: "MARB" }),
          newGedcomFact({ tag: "MARC" }),
          newGedcomFact({ tag: "MARL" }),
          newGedcomFact({ tag: "MARR" }),
          newGedcomFact({ tag: "MARS" }),
          newGedcomFact({ tag: "EVEN", value: "value", type: "type" }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });
});
