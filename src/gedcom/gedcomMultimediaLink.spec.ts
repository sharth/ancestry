import {
  parseGedcomMultimediaLink,
  serializeGedcomMultimediaLink,
} from "./gedcomMultimediaLink";
import type { GedcomRecord } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("gedcomMultimediaLink", () => {
  const gedcomRecord: GedcomRecord = {
    tag: "OBJE",
    abstag: "",
    value: "@M1@",
    children: [],
  };
  it("parser", () => {
    expect(parseGedcomMultimediaLink(gedcomRecord)).toEqual({
      xref: "@M1@",
      title: "",
    });
  });
  it("serializer", () => {
    expect(
      serializeGedcomMultimediaLink(parseGedcomMultimediaLink(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
});
