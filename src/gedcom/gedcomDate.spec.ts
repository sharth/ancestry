import { parseGedcomDate, serializeGedcomDate } from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("gedcomDate", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "DATE",
    abstag: "",
    xref: "",
    value: "ABT 1900",
    children: [],
  };
  it("parser", () => {
    expect(parseGedcomDate(gedcomRecord)).toEqual({
      value: "ABT 1900",
    });
  });
  it("serializer", () => {
    expect(serializeGedcomDate(parseGedcomDate(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
});
