import { type GedcomRecord, mergeConcContRecords } from "./gedcomRecord";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "./gedcomRecord";
import { describe, expect, it } from "vitest";

describe("GedcomRecord", () => {
  // CONC will be discarded during parsing, and will not be preserved.
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
        value: undefined,
        children: [
          {
            tag: "NAME",
            abstag: "SUBM.NAME",
            xref: undefined,
            value: "Jo",
            children: [
              {
                tag: "CONC",
                abstag: "SUBM.NAME.CONC",
                xref: undefined,
                value: "hn",
                children: [],
              },
              {
                tag: "CONT",
                abstag: "SUBM.NAME.CONT",
                xref: undefined,
                value: "Doe",
                children: [],
              },
            ],
          },
        ],
      },
      {
        tag: "SUBM",
        abstag: "SUBM",
        xref: "@X2@",
        value: undefined,
        children: [
          {
            tag: "EMAIL",
            abstag: "SUBM.EMAIL",
            xref: undefined,
            value: undefined,
            children: [
              {
                tag: "CONC",
                abstag: "SUBM.EMAIL.CONC",
                xref: undefined,
                value: "johndoe@example.com",
                children: [],
              },
            ],
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
      "1 NAME Jo",
      "2 CONC hn",
      "2 CONT Doe",
      "0 @X2@ SUBM",
      "1 EMAIL",
      "2 CONC johndoe@example.com",
    ]);
  });

  it("Merging CONC and CONT", () => {
    const gedcomText = [
      "0 @X1@ SUBM",
      "1 NAME Jo",
      "2 CONC hn",
      "2 CONT Doe",
      "1 EMAIL",
      "2 CONC johndoe@example.com",
    ].join("\n");

    const gedcomRecords = parseGedcomRecords(gedcomText);
    expect(gedcomRecords.map((r) => mergeConcContRecords(r))).toEqual([
      {
        tag: "SUBM",
        abstag: "SUBM",
        xref: "@X1@",
        value: undefined,
        children: [
          {
            tag: "NAME",
            abstag: "SUBM.NAME",
            xref: undefined,
            value: "John\nDoe",
            children: [],
          },
          {
            tag: "EMAIL",
            abstag: "SUBM.EMAIL",
            xref: undefined,
            value: "johndoe@example.com",
            children: [],
          },
        ],
      },
    ]);
  });
});
