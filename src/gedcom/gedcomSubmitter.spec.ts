import { produce } from "immer";
import { assert, describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
import {
  newGedcomRecord,
  parseGedcomRecords,
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  newGedcomSubmitter,
  parseGedcomSubmitter,
  serializeGedcomSubmitter,
} from "./gedcomSubmitter";

function parseGedcomRecordsFromArray(lines: string[]): GedcomRecord[] {
  return parseGedcomRecords(lines.join("\n"));
}

describe("GedcomSubmitter", () => {
  it("no fields", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "SUBM",
      abstag: "SUBM",
      xref: "@SUBMITTER1@",
    });
    expect(parseGedcomSubmitter(gedcomRecord)).toEqual(
      newGedcomSubmitter({
        xref: "@SUBMITTER1@",
      }),
    );
    expect(
      serializeGedcomSubmitter(parseGedcomSubmitter(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
  it("with details", () => {
    const [gedcomRecord] = parseGedcomRecordsFromArray([
      "0 @X2@ SUBM",
      "1 NAME John Doe",
      "1 _EMAIL johndoe@example.com",
    ]);
    assert.isDefined(gedcomRecord);
    expect(parseGedcomSubmitter(gedcomRecord)).toEqual(
      newGedcomSubmitter({
        xref: "@X2@",
        name: "John Doe",
        email: "johndoe@example.com",
      }),
    );
    expect(
      serializeGedcomSubmitter(parseGedcomSubmitter(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
  it("with a change date", () => {
    const gedcomText = ["0 @X3@ SUBM", "1 CHAN", "2 DATE 1 JAN 1900"];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isDefined(gedcomRecord);
    const gedcomSubmitter = parseGedcomSubmitter(gedcomRecord);
    expect(gedcomSubmitter).toEqual(
      newGedcomSubmitter({
        xref: "@X3@",
        changeDate: newGedcomChangeDate({ value: "1 JAN 1900" }),
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomSubmitter(gedcomSubmitter)),
    ).toEqual(gedcomText);
  });
});

describe("serializeGedcomSubmitter cache", () => {
  it("returns the parsed record itself when it round-trips exactly", () => {
    const [record] = parseGedcomRecords(
      ["0 @U1@ SUBM", "1 NAME Bill"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomSubmitter(record);

    expect(serializeGedcomSubmitter(parsed)).toBe(record);
  });

  it("serializes an edited copy afresh", () => {
    const [record] = parseGedcomRecords(
      ["0 @U1@ SUBM", "1 NAME Bill"].join("\n"),
    );
    assert.isDefined(record);
    const parsed = parseGedcomSubmitter(record);
    const edited = produce(parsed, (draft) => {
      draft.name = "William";
    });

    expect(
      serializeGedcomRecordToText(serializeGedcomSubmitter(edited)),
    ).toEqual(["0 @U1@ SUBM", "1 NAME William"]);
    expect(
      serializeGedcomRecordToText(serializeGedcomSubmitter(parsed)),
    ).toEqual(["0 @U1@ SUBM", "1 NAME Bill"]);
  });
});
