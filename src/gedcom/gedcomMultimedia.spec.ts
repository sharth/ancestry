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
    value: "",
    children: [
      {
        tag: "CHAN",
        abstag: "",
        xref: "",
        value: "",
        children: [
          {
            tag: "DATE",
            abstag: "",
            xref: "",
            value: "1 JAN 2020",
            children: [],
          },
        ],
      },
    ],
  };
  it("parser", () => {
    expect(parseGedcomMultimedia(gedcomRecord)).toEqual({
      xref: "@M1@",
      filePath: "",
      mediaType: "",
      changeDate: { date: { value: "1 JAN 2020" } },
    });
  });
  it("serializer", () => {
    expect(
      serializeGedcomMultimedia(parseGedcomMultimedia(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
});
