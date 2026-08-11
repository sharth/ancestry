import { describe, expect, it } from "vitest";
import {
  newGedcomEvent,
  parseGedcomEvent,
  serializeGedcomEvent,
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
    expect(parseGedcomEvent(gedcomRecord)).toEqual(
      newGedcomEvent({
        tag: "BIRT",
        date: { value: "JAN 1 2025" },
      }),
    );
  });
  it("serializer", () => {
    expect(serializeGedcomEvent(parseGedcomEvent(gedcomRecord))).toEqual(
      gedcomRecord,
    );
  });
});
