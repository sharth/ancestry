import {
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
} from "./gedcomChangeDate";
import type { GedcomRecord } from "./gedcomRecord";
import { parseGedcomRecords } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

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

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("GedcomChangeDate", () => {
  it("with value", () => {
    const gedcomText = ["0 CHAN", "1 DATE 1 JAN 1900"];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );

    expectToBeDefined(gedcomRecord);
    expect(parseGedcomChangeDate(gedcomRecord)).toEqual({
      date: { value: "1 JAN 1900" },
    });
    expect(
      normalize(serializeGedcomChangeDate(parseGedcomChangeDate(gedcomRecord))),
    ).toEqual(normalize(gedcomRecord));
  });

  it("without value", () => {
    const gedcomChangeDate = { date: { value: "" } };
    expect(serializeGedcomChangeDate(gedcomChangeDate)).toBeNull();
  });
});
