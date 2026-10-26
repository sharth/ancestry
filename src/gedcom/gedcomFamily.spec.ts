import { assert, describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
import { newGedcomDate } from "./gedcomDate";
import { newGedcomFact } from "./gedcomFact";
import {
  newGedcomFamily,
  parseGedcomFamily,
  serializeGedcomFamily,
} from "./gedcomFamily";
import {
  newGedcomRecord,
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

  it("parse family with a change date", () => {
    const gedcomText = [
      "0 @F5@ FAM", //
      "1 CHAN",
      "2 DATE 1 JAN 1900",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F5@",
        changeDate: newGedcomChangeDate({ value: "1 JAN 1900" }),
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  // Regression test: a FAM record containing tags the parser doesn't have
  // a typed field for (e.g. NOTE, RIN) used to be silently dropped on
  // serialize, since GedcomFamily had no `unknownRecords` fallback (unlike
  // GedcomIndividual/GedcomSource). That data loss made an untouched,
  // freshly opened family look different from the original file, which is
  // what caused the GEDCOM editor's unsaved-changes warning to fire on
  // Escape even without any edits.
  it("round-trips FAM child records it doesn't have a typed field for", () => {
    const gedcomText = [
      "0 @F6@ FAM", //
      "1 HUSB @I1@",
      "1 WIFE @I2@",
      "1 NOTE Some family note",
      "1 RIN 123",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F6@",
        husbandXref: "@I1@",
        wifeXref: "@I2@",
        unknownRecords: [
          newGedcomRecord({
            tag: "NOTE",
            abstag: "FAM.NOTE",
            value: "Some family note",
          }),
          newGedcomRecord({
            tag: "RIN",
            abstag: "FAM.RIN",
            value: "123",
          }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  it("serializes facts ordered by SDATE when present, otherwise DATE", () => {
    const gedcomFamily = newGedcomFamily({
      xref: "@F1@",
      facts: [
        newGedcomFact({
          tag: "DIV",
          date: newGedcomDate({ value: "1960" }),
        }),
        newGedcomFact({
          tag: "ENGA",
          date: newGedcomDate({ value: "ABT 1949" }),
          sortDate: newGedcomDate({ value: "1949" }),
        }),
        newGedcomFact({
          tag: "MARR",
          date: newGedcomDate({ value: "1950" }),
        }),
      ],
    });
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual([
      "0 @F1@ FAM",
      "1 ENGA",
      "2 DATE ABT 1949",
      "2 SDATE 1949",
      "1 MARR",
      "2 DATE 1950",
      "1 DIV",
      "2 DATE 1960",
    ]);
  });
});
