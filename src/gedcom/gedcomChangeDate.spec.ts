import { assert, describe, expect, it } from "vitest";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
} from "./gedcomChangeDate";
import { parseGedcomRecords, type GedcomRecord } from "./gedcomRecord";

function normalize(record: GedcomRecord | null): GedcomRecord | null {
  if (record === null) {
    return null;
  }
  return {
    tag: record.tag,
    abstag: "",
    xref: record.xref,
    value: record.value,
    children: record.children.map(normalize).filter((r) => r !== null),
  };
}

describe("GedcomChangeDate", () => {
  it("with value", () => {
    const gedcomText = [
      "0 CHAN", //
      "1 DATE 1 JAN 1900",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    assert.isDefined(gedcomRecord);
    expect(parseGedcomChangeDate(gedcomRecord)).toEqual(
      newGedcomChangeDate({ value: "1 JAN 1900" }),
    );
    expect(
      normalize(serializeGedcomChangeDate(parseGedcomChangeDate(gedcomRecord))),
    ).toEqual(normalize(gedcomRecord));
  });

  it("without value is null", () => {
    const gedcomChangeDate = newGedcomChangeDate();
    expect(serializeGedcomChangeDate(gedcomChangeDate)).toBeNull();
  });
});
