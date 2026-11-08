import { describe, expect, it } from "vitest";

import { newGedcomRecord } from "./gedcomRecord";
import {
  parseGedcomSourceCitation,
  serializeGedcomSourceCitation,
} from "./gedcomSourceCitation";

describe("gedcomSourceCitation", () => {
  const gedcomRecord = newGedcomRecord({
    tag: "SOUR",
    value: "@S1@",
    children: [
      newGedcomRecord({ tag: "PAGE", value: "page 123" }),
      newGedcomRecord({ tag: "QUAY", value: "0" }),
      newGedcomRecord({
        tag: "DATA",
        children: [newGedcomRecord({ tag: "TEXT", value: "text" })],
      }),
    ],
  });
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
