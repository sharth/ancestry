import { describe, expect, it } from "vitest";
import {
  newGedcomDate,
  parseGedcomDate,
  serializeGedcomDate,
  type GedcomDate,
} from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";

describe("gedcomDate", () => {
  it("Exact Date", () => {
    const gedcomRecord: GedcomRecord = {
      tag: "DATE",
      abstag: "",
      xref: "",
      value: "ABT 1900",
      children: [],
    };

    expect(parseGedcomDate(gedcomRecord)).toEqual({
      value: "ABT 1900",
    });
    expect(serializeGedcomDate(parseGedcomDate(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });

  it("serializes to null if empty", () => {
    const gedcomDate = newGedcomDate({ value: "" });
    expect(serializeGedcomDate(gedcomDate)).toBeNull();
  });

  it("newGedcomDate remembers fields", () => {
    expect(newGedcomDate()).toEqual<GedcomDate>({
      value: "",
    });
    expect(newGedcomDate({ value: "1 JAN 2000" })).toEqual<GedcomDate>({
      value: "1 JAN 2000",
    });
  });
});
