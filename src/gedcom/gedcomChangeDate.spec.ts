import {
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
} from "./gedcomChangeDate";
import type { GedcomRecord } from "./gedcomRecord";
import { parseGedcomRecords } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

function normalize(record: GedcomRecord): GedcomRecord {
  return {
    tag: record.tag,
    abstag: "",
    xref: record.xref,
    value: record.value,
    children: record.children.map(normalize),
  };
}

describe("GedcomChangeDate", () => {
  const gedcomText = ["0 CHAN", "1 DATE 1 JAN 1900"];
  const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
    gedcomText.join("\n"),
  );

  it("parser", () => {
    expect(parseGedcomChangeDate(gedcomRecord)).toEqual({
      date: { value: "1 JAN 1900" },
    });
  });
  it("serializer", () => {
    expect(
      normalize(serializeGedcomChangeDate(parseGedcomChangeDate(gedcomRecord))),
    ).toEqual(normalize(gedcomRecord));
  });
});
