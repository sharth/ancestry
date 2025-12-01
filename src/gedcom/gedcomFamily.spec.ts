import { parseGedcomFamily, serializeGedcomFamily } from "./gedcomFamily";
import type { GedcomRecord } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("gedcomFamily", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "FAM",
    abstag: "FAM",
    xref: "@F1@",
    value: "",
    children: [
      {
        tag: "HUSB",
        abstag: "FAM.HUSB",
        xref: "",
        value: "@I1@",
        children: [],
      },
      {
        tag: "CHIL",
        abstag: "FAM.CHIL",
        xref: "",
        value: "@I10@",
        children: [],
      },
      {
        tag: "CHIL",
        abstag: "FAM.CHIL",
        xref: "",
        value: "@I11@",
        children: [],
      },
    ],
  };
  it("parser", () => {
    expect(parseGedcomFamily(gedcomRecord)).toEqual({
      xref: "@F1@",
      husbandXref: "@I1@",
      wifeXref: "",
      childXrefs: ["@I10@", "@I11@"],
      events: [],
      citations: [],
    });
  });
  it("serializer", () => {
    expect(serializeGedcomFamily(parseGedcomFamily(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
});
