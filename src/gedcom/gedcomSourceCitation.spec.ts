import { describe, expect, it } from "vitest";

import type { GedcomRecord } from "./gedcomRecord";
import {
  parseGedcomSourceCitation,
  serializeGedcomSourceCitation,
} from "./gedcomSourceCitation";

describe("gedcomSourceCitation", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "SOUR",
    xref: "",
    value: "@S1@",
    children: [
      { tag: "PAGE", xref: "", value: "page 123", children: [] },
      { tag: "QUAY", xref: "", value: "0", children: [] },
      {
        tag: "DATA",
        xref: "",
        value: "",
        children: [{ tag: "TEXT", xref: "", value: "text", children: [] }],
      },
    ],
  };
  it("parser", () => {
    expect(parseGedcomSourceCitation(gedcomRecord)).toEqual({
      sourceXref: "@S1@",
      text: "text",
      page: "page 123",
      quality: "0",
      notes: [],
      multimediaLinks: [],
    });
  });
  it("serializer", () => {
    expect(
      serializeGedcomSourceCitation(parseGedcomSourceCitation(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
});
