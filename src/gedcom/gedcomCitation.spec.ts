import { parseGedcomCitation, serializeGedcomCitation } from "./gedcomCitation";
import type { GedcomRecord } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("gedcomCitation", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "SOUR",
    abstag: "",
    xref: "",
    value: "@S1@",
    children: [
      { tag: "PAGE", abstag: "", xref: "", value: "page 123", children: [] },
      { tag: "QUAY", abstag: "", xref: "", value: "0", children: [] },
      {
        tag: "DATA",
        abstag: "",
        xref: "",
        value: "",
        children: [
          { tag: "TEXT", abstag: "", xref: "", value: "text", children: [] },
        ],
      },
    ],
  };
  it("parser", () => {
    expect(parseGedcomCitation(gedcomRecord)).toEqual({
      sourceXref: "@S1@",
      text: "text",
      page: "page 123",
      quality: "0",
      notes: [],
      multimediaLinks: [],
    });
  });
  it("serializer", () => {
    expect(serializeGedcomCitation(parseGedcomCitation(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
});
