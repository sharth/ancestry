import { describe, expect, it } from "vitest";

import {
  gedcomRecordsEqual,
  newGedcomRecord,
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";

describe("GedcomRecord", () => {
  // CONC and CONT will be discarded during parsing, and will not be preserved by the parser.
  // CONT will be generated when serializing.
  it("Simple Parsing and Serializing", () => {
    const gedcomText = [
      "0 @X1@ SUBM",
      "1 NAME Jo",
      "2 CONC hn",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 EMAIL",
      "2 CONC johndoe@example.com",
    ].join("\n");
    expect(parseGedcomRecords(gedcomText)).toEqual([
      {
        tag: "SUBM",
        xref: "@X1@",
        value: "",
        children: [
          {
            tag: "NAME",
            xref: "",
            value: "John\nDoe",
            children: [],
          },
        ],
      },
      {
        tag: "SUBM",
        xref: "@X2@",
        value: "",
        children: [
          {
            tag: "EMAIL",
            xref: "",
            value: "johndoe@example.com",
            children: [],
          },
        ],
      },
    ]);
    expect(
      parseGedcomRecords(gedcomText).flatMap((r) =>
        serializeGedcomRecordToText(r),
      ),
    ).toEqual([
      "0 @X1@ SUBM",
      "1 NAME John",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 EMAIL johndoe@example.com",
    ]);
  });
});

describe("gedcomRecordsEqual", () => {
  it("treats the same object as equal", () => {
    const record = newGedcomRecord({ tag: "INDI", xref: "@I1@" });
    expect(gedcomRecordsEqual(record, record)).toBe(true);
  });

  it("compares tag, xref, value and children", () => {
    const record = newGedcomRecord({
      tag: "INDI",
      xref: "@I1@",
      children: [newGedcomRecord({ tag: "SEX", value: "M" })],
    });
    expect(gedcomRecordsEqual(record, { ...record, tag: "FAM" })).toBe(false);
    expect(gedcomRecordsEqual(record, { ...record, xref: "@I2@" })).toBe(false);
    expect(gedcomRecordsEqual(record, { ...record, value: "x" })).toBe(false);
    expect(gedcomRecordsEqual(record, { ...record, children: [] })).toBe(false);
    expect(
      gedcomRecordsEqual(record, {
        ...record,
        children: [newGedcomRecord({ tag: "SEX", value: "F" })],
      }),
    ).toBe(false);
  });
});
