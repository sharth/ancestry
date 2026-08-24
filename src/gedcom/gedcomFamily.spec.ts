import { assert, describe, expect, it } from "vitest";
import {
  newGedcomFamily,
  parseGedcomFamily,
  serializeGedcomFamily,
} from "./gedcomFamily";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";

describe("gedcomFamily", () => {
  it("parse family with husband, no wife and two children", () => {
    const gedcomText = [
      "0 @F1@ FAM", //
      "1 HUSB @I1@",
      "1 CHIL @I10@",
      "1 CHIL @I11@",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F1@",
        husbandXref: "@I1@",
        childXrefs: ["@I10@", "@I11@"],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  it("parse family with no husband, no wife and no children", () => {
    const gedcomText = [
      "0 @F2@ FAM", //
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F2@",
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });

  it("parse family with husband, wife and no children", () => {
    const gedcomText = [
      "0 @F3@ FAM", //
      "1 HUSB @I3@",
      "1 WIFE @I2@",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    assert.isOk(gedcomRecord);
    const gedcomFamily = parseGedcomFamily(gedcomRecord);
    expect(gedcomFamily).toEqual(
      newGedcomFamily({
        xref: "@F3@",
        husbandXref: "@I3@",
        wifeXref: "@I2@",
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomFamily(gedcomFamily)),
    ).toEqual(gedcomText);
  });
});
