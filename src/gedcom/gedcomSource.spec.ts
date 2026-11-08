import { produce } from "immer";
import { assert, describe, expect, it } from "vitest";

import {
  newGedcomRecord,
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import {
  newGedcomSource,
  parseGedcomSource,
  serializeGedcomSource,
} from "./gedcomSource";

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("GedcomSource", () => {
  it("no fields", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "SOUR",
      abstag: "SOUR",
      xref: "@S1@",
    });
    const gedcomSource = newGedcomSource({
      xref: "@S1@",
    });
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
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomSource(gedcomRecord)).toEqual(
      newGedcomSource({
        xref: "@S2@",
        abbr: "abbr",
        title: "title",
        text: "text and more text",
        unknownRecords: [
          newGedcomRecord({
            tag: "_TMPLT",
            abstag: "SOUR._TMPLT",
            children: [
              newGedcomRecord({
                tag: "TID",
                abstag: "SOUR._TMPLT.TID",
                value: "72",
              }),
            ],
          }),
        ],
      }),
    );
  });
});

describe("serializeGedcomSource cache", () => {
  it("returns the parsed record itself when it round-trips exactly", () => {
    const [record] = parseGedcomRecords(
      ["0 @S1@ SOUR", "1 TITL Title"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomSource(record);

    expect(serializeGedcomSource(parsed)).toBe(record);
  });

  it("serializes an edited copy afresh", () => {
    const [record] = parseGedcomRecords(
      ["0 @S1@ SOUR", "1 TITL Title"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomSource(record);
    const edited = produce(parsed, (draft) => {
      draft.title = "New title";
    });

    expect(serializeGedcomRecordToText(serializeGedcomSource(edited))).toEqual([
      "0 @S1@ SOUR",
      "1 TITL New title",
    ]);
    expect(serializeGedcomRecordToText(serializeGedcomSource(parsed))).toEqual([
      "0 @S1@ SOUR",
      "1 TITL Title",
    ]);
  });
});
