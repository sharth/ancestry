import { describe, expect, it } from "vitest";
import {
  parseGedcomEvent,
  serializeGedcomEvent,
  type GedcomEvent,
} from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

describe("gedcomEvent", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "BIRT",
    abstag: "",
    xref: "",
    value: "",
    children: [
      { tag: "DATE", abstag: "", xref: "", value: "JAN 1 2025", children: [] },
    ],
  };
  it("parser", () => {
    expect(parseGedcomEvent(gedcomRecord)).toEqual({
      tag: "BIRT",
      type: "",
      address: "",
      place: "",
      cause: "",
      value: "",
      citations: [],
      sharedWith: [],
      notes: [],
      date: { value: "JAN 1 2025" },
      sortDate: { value: "" },
    } as GedcomEvent);
  });
  it("serializer", () => {
    expect(serializeGedcomEvent(parseGedcomEvent(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
});
