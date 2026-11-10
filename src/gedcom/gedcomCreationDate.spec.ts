import { assert, describe, expect, it } from "vitest";

import {
  newGedcomCreationDate,
  parseGedcomCreationDate,
  serializeGedcomCreationDate,
} from "./gedcomCreationDate";
import { parseGedcomRecords, type GedcomRecord } from "./gedcomRecord";

describe("GedcomCreationDate", () => {
  it("with value", () => {
    const gedcomText = [
      "0 CREA", //
      "1 DATE 1 JAN 1900",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    assert.isDefined(gedcomRecord);
    expect(parseGedcomCreationDate(gedcomRecord)).toEqual(
      newGedcomCreationDate({ value: "1 JAN 1900" }),
    );
    expect(
      serializeGedcomCreationDate(parseGedcomCreationDate(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("without value is null", () => {
    const gedcomCreationDate = newGedcomCreationDate();
    expect(serializeGedcomCreationDate(gedcomCreationDate)).toBeNull();
  });
});
