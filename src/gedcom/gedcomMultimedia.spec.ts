import {
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
} from "./gedcomMultimedia";
import type { GedcomRecord } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("gedcomMultimedia", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "OBJE",
    abstag: "OBJE",
    xref: "@M1@",
    children: [],
  };
  it("parser", () => {
    expect(parseGedcomMultimedia(gedcomRecord)).toEqual({
      xref: "@M1@",
      filePath: "",
      mediaType: "",
    });
  });
  it("serializer", () => {
    expect(
      serializeGedcomMultimedia(parseGedcomMultimedia(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
});
