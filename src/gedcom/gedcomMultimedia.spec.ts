import { produce } from "immer";
import { assert, describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
import {
  newGedcomMultimedia,
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
} from "./gedcomMultimedia";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";

describe("gedcomMultimedia", () => {
  it("parser handles full record", () => {
    const gedcomText = [
      "0 @M1@ OBJE", //
      "1 FILE path/to/file.jpg",
      "2 FORM jpg",
      "2 TITL My Title",
      "1 CHAN",
      "2 DATE 1 JAN 2020",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomMultimedia = parseGedcomMultimedia(gedcomRecord);
    expect(gedcomMultimedia).toEqual(
      newGedcomMultimedia({
        xref: "@M1@",
        filePath: "path/to/file.jpg",
        mediaType: "jpg",
        title: "My Title",
        changeDate: newGedcomChangeDate({ value: "1 JAN 2020" }),
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomMultimedia(gedcomMultimedia)),
    ).toEqual(gedcomText);
  });

  it("parser handles minimal record", () => {
    const gedcomText = [
      "0 @M2@ OBJE", //
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomMultimedia = parseGedcomMultimedia(gedcomRecord);
    expect(gedcomMultimedia).toEqual(newGedcomMultimedia({ xref: "@M2@" }));
    expect(
      serializeGedcomRecordToText(serializeGedcomMultimedia(gedcomMultimedia)),
    ).toEqual(gedcomText);
  });

  it("serializer handles minimal record", () => {
    const gedcomText = [
      "0 @M2@ OBJE", //
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomMultimedia = parseGedcomMultimedia(gedcomRecord);
    expect(gedcomMultimedia).toEqual(newGedcomMultimedia({ xref: "@M2@" }));
    expect(
      serializeGedcomRecordToText(serializeGedcomMultimedia(gedcomMultimedia)),
    ).toEqual(gedcomText);
  });

  describe("error conditions", () => {
    it("throws on multiple file paths", () => {
      const gedcomText = [
        "0 @M1@ OBJE", //
        "1 FILE path/to/file.jpg",
        "1 FILE path/to/file2.jpg",
      ];
      const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
      assert.isOk(gedcomRecord);
      expect(() => parseGedcomMultimedia(gedcomRecord)).toThrow(
        "Multiple filePaths are not supported.",
      );
    });

    it("throws on multiple media types", () => {
      const gedcomText = [
        "0 @M1@ OBJE", //
        "1 FILE p1",
        "2 FORM jpg",
        "2 FORM png",
      ];
      const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
      assert.isOk(gedcomRecord);
      expect(() => parseGedcomMultimedia(gedcomRecord)).toThrow(
        "Multiple mediaTypes are not allowed",
      );
    });

    it("throws on multiple titles", () => {
      const gedcomText = [
        "0 @M1@ OBJE", //
        "1 FILE p1",
        "2 TITL t1",
        "2 TITL t2",
      ];
      const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
      assert.isOk(gedcomRecord);
      expect(() => parseGedcomMultimedia(gedcomRecord)).toThrow(
        "Multiple titles are not allowed",
      );
    });

    it("throws on multiple change dates", () => {
      const gedcomText = [
        "0 @M1@ OBJE", //
        "1 CHAN",
        "2 DATE 1 JAN 2020",
        "1 CHAN",
        "2 DATE 2 JAN 2020",
      ];
      const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
      assert.isOk(gedcomRecord);
      expect(() => parseGedcomMultimedia(gedcomRecord)).toThrow(
        "Multiple change dates are not allowed",
      );
    });

    it("throws on invalid tag", () => {
      const gedcomText = [
        "0 @I1@ INDI", //
      ];
      const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
      assert.isOk(gedcomRecord);
      expect(() => parseGedcomMultimedia(gedcomRecord)).toThrow();
    });

    it("throws on missing xref", () => {
      const gedcomText = [
        "0 OBJE", //
      ];
      const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
      assert.isOk(gedcomRecord);
      expect(() => parseGedcomMultimedia(gedcomRecord)).toThrow();
    });
  });
});

describe("serializeGedcomMultimedia cache", () => {
  it("returns the parsed record itself when it round-trips exactly", () => {
    const [record] = parseGedcomRecords(
      ["0 @M1@ OBJE", "1 FILE a.jpg", "2 FORM jpg"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomMultimedia(record);

    expect(serializeGedcomMultimedia(parsed)).toBe(record);
  });

  it("serializes an edited copy afresh", () => {
    const [record] = parseGedcomRecords(
      ["0 @M1@ OBJE", "1 FILE a.jpg", "2 FORM jpg"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomMultimedia(record);
    const edited = produce(parsed, (draft) => {
      draft.filePath = "b.jpg";
    });

    expect(
      serializeGedcomRecordToText(serializeGedcomMultimedia(edited)),
    ).toEqual(["0 @M1@ OBJE", "1 FILE b.jpg", "2 FORM jpg"]);
    expect(
      serializeGedcomRecordToText(serializeGedcomMultimedia(parsed)),
    ).toEqual(["0 @M1@ OBJE", "1 FILE a.jpg", "2 FORM jpg"]);
  });
});
