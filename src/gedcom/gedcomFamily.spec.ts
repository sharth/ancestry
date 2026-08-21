import { describe, expect, it } from "vitest";
import {
  newGedcomFamily,
  parseGedcomFamily,
  serializeGedcomFamily,
} from "./gedcomFamily";
import type { GedcomRecord } from "./gedcomRecord";

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
    expect(parseGedcomFamily(gedcomRecord)).toEqual(
      newGedcomFamily({
        xref: "@F1@",
        husbandXref: "@I1@",
        childXrefs: ["@I10@", "@I11@"],
      }),
    );
  });
  it("serializer", () => {
    expect(serializeGedcomFamily(parseGedcomFamily(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
});
