import { describe, expect, it } from "vitest";

import {
  parseGedcomName,
  serializeGedcomName,
  type GedcomName,
} from "./gedcomName";
import { parseGedcomRecords, type GedcomRecord } from "./gedcomRecord";

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("GedcomName", () => {
  it("Simple Name", () => {
    const gedcomText = [
      "0 NAME John /Doe/",
      "1 NPFX Mr.",
      "1 GIVN John",
      "1 SURN Doe",
      "1 NSFX Jr.",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );

    expectToBeDefined(gedcomRecord);
    expect(parseGedcomName(gedcomRecord)).toEqual({
      prefix: "Mr.",
      givenName: "John",
      nickName: "",
      surnamePrefix: "",
      surname: "Doe",
      suffix: "Jr.",
      nameType: "",
      citations: [],
      notes: [],
    });
    expect(serializeGedcomName(parseGedcomName(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
  it("serializes to null if empty", () => {
    const gedcomName: GedcomName = {
      prefix: "",
      givenName: "",
      nickName: "",
      surnamePrefix: "",
      surname: "",
      suffix: "",
      nameType: "",
      citations: [],
      notes: [],
    };
    expect(serializeGedcomName(gedcomName)).toBeNull();
  });
});
