import type { GedcomDate } from "./gedcomDate";
import { parseGedcomDate, serializeGedcomDate } from "./gedcomDate";
import { GedcomName, parseGedcomName, serializeGedcomName } from "./gedcomName";
import { type GedcomRecord, parseGedcomRecords } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("GedcomName", () => {
  it("Simple Name", () => {
    const gedcomText = [
      "0 NAME Mr. John /Doe/ Jr.",
      "1 NPFX Mr.",
      "1 GIVN John",
      "1 SURN Doe",
      "1 NSFX Jr.",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );

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
    expect(serializeGedcomDate(gedcomName)).toBeNull();
  });
});
