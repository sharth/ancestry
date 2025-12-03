import type { GedcomName } from "./gedcomName";
import { parseGedcomName, serializeGedcomName } from "./gedcomName";
import { type GedcomRecord, parseGedcomRecords } from "./gedcomRecord";
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
    expect(
      normalize(serializeGedcomName(parseGedcomName(gedcomRecord))),
    ).toEqual(normalize(gedcomRecord));
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
