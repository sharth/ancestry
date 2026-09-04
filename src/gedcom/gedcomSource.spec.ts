import { describe, expect, it } from "vitest";
import { newGedcomRecord, parseGedcomRecords } from "./gedcomRecord";
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
