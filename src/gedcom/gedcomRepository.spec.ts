import { assert, describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
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
    const gedcomRecord = newGedcomRecord({
      tag: "REPO",
      abstag: "REPO",
      xref: "@R1@",
    });
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
});
