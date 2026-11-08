import { assert, describe, expect, it } from "vitest";

import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
} from "./gedcomChangeDate";
import { parseGedcomRecords, type GedcomRecord } from "./gedcomRecord";

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
      serializeGedcomChangeDate(parseGedcomChangeDate(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("without value is null", () => {
    const gedcomChangeDate = newGedcomChangeDate();
    expect(serializeGedcomChangeDate(gedcomChangeDate)).toBeNull();
  });
});
