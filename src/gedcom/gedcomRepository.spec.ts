import { produce } from "immer";
import { assert, describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
import { newGedcomCreationDate } from "./gedcomCreationDate";
import {
  newGedcomRecord,
  parseGedcomRecords,
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  newGedcomRepository,
  parseGedcomRepository,
  serializeGedcomRepository,
} from "./gedcomRepository";

function parseGedcomRecordsFromArray(lines: string[]): GedcomRecord[] {
  return parseGedcomRecords(lines.join("\n"));
}

describe("GedcomRepository", () => {
  it("no fields", () => {
    const gedcomRecord = newGedcomRecord({ tag: "REPO", xref: "@R1@" });
    expect(parseGedcomRepository(gedcomRecord)).toEqual(
      newGedcomRepository({
        xref: "@R1@",
      }),
    );
    expect(
      serializeGedcomRepository(parseGedcomRepository(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("with a name", () => {
    const [gedcomRecord] = parseGedcomRecordsFromArray([
      "0 @R2@ REPO",
      "1 NAME Family History Library",
    ]);
    assert.isDefined(gedcomRecord);
    expect(parseGedcomRepository(gedcomRecord)).toEqual(
      newGedcomRepository({
        xref: "@R2@",
        name: "Family History Library",
      }),
    );
    expect(
      serializeGedcomRepository(parseGedcomRepository(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("with a change date", () => {
    const gedcomText = [
      "0 @R3@ REPO",
      "1 NAME Family History Library",
      "1 CHAN",
      "2 DATE 1 JAN 1900",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomRepository = parseGedcomRepository(gedcomRecord);
    expect(gedcomRepository).toEqual(
      newGedcomRepository({
        xref: "@R3@",
        name: "Family History Library",
        changeDate: newGedcomChangeDate({ value: "1 JAN 1900" }),
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomRepository(gedcomRepository)),
    ).toEqual(gedcomText);
  });
  it("with a creation date", () => {
    const gedcomText = [
      "0 @R4@ REPO",
      "1 NAME Family History Library",
      "1 CHAN",
      "2 DATE 2 JAN 1900",
      "1 CREA",
      "2 DATE 1 JAN 1900",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomRepository = parseGedcomRepository(gedcomRecord);
    expect(gedcomRepository).toEqual(
      newGedcomRepository({
        xref: "@R4@",
        name: "Family History Library",
        changeDate: newGedcomChangeDate({ value: "2 JAN 1900" }),
        creationDate: newGedcomCreationDate({ value: "1 JAN 1900" }),
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomRepository(gedcomRepository)),
    ).toEqual(gedcomText);
  });
});

describe("serializeGedcomRepository cache", () => {
  it("returns the parsed record itself when it round-trips exactly", () => {
    const [record] = parseGedcomRecords(
      ["0 @R1@ REPO", "1 NAME Archive"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomRepository(record);

    expect(serializeGedcomRepository(parsed)).toBe(record);
  });

  it("serializes an edited copy afresh", () => {
    const [record] = parseGedcomRecords(
      ["0 @R1@ REPO", "1 NAME Archive"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomRepository(record);
    const edited = produce(parsed, (draft) => {
      draft.name = "Library";
    });

    expect(
      serializeGedcomRecordToText(serializeGedcomRepository(edited)),
    ).toEqual(["0 @R1@ REPO", "1 NAME Library"]);
    expect(
      serializeGedcomRecordToText(serializeGedcomRepository(parsed)),
    ).toEqual(["0 @R1@ REPO", "1 NAME Archive"]);
  });
});
