import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("GedcomRecord", () => {
  // CONC and CONT will be discarded during parsing, and will not be preserved by the parser.
  // CONT will be generated when serializing.
  it("Simple Parsing and Serializing", () => {
    const gedcomText = [
      "0 @X1@ SUBM",
      "1 NAME Jo",
      "2 CONC hn",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 EMAIL",
      "2 CONC johndoe@example.com",
    ].join("\n");
    expect(parseGedcomRecords(gedcomText)).toEqual([
      {
        tag: "SUBM",
        abstag: "SUBM",
        xref: "@X1@",
        value: "",
        children: [
          {
            tag: "NAME",
            abstag: "SUBM.NAME",
            xref: "",
            value: "John\nDoe",
            children: [],
          },
        ],
      },
      {
        tag: "SUBM",
        abstag: "SUBM",
        xref: "@X2@",
        value: "",
        children: [
          {
            tag: "EMAIL",
            abstag: "SUBM.EMAIL",
            xref: "",
            value: "johndoe@example.com",
            children: [],
          },
        ],
      },
    ]);
    expect(
      parseGedcomRecords(gedcomText).flatMap((r) =>
        serializeGedcomRecordToText(r),
      ),
    ).toEqual([
      "0 @X1@ SUBM",
      "1 NAME John",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 EMAIL johndoe@example.com",
    ]);
  });
});
