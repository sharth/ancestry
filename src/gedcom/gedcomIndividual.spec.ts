import {
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import type { GedcomRecord } from "./gedcomRecord";
import { parseGedcomRecords } from "./gedcomRecord";
import { describe, expect, it } from "vitest";

function normalize(record: GedcomRecord): GedcomRecord {
  return {
    tag: record.tag,
    abstag: "",
    xref: record.xref ?? "",
    value: record.value ?? "",
    children: record.children.map(normalize),
  };
}

describe("gedcomIndividual", () => {
  it("no fields", () => {
    const gedcomRecord = {
      tag: "INDI",
      abstag: "INDI",
      xref: "@I1@",
      children: [],
    };
    expect(parseGedcomIndividual(gedcomRecord)).toEqual({
      xref: "@I1@",
      names: [],
      events: [],
      parentOfFamilyXrefs: [],
      childOfFamilyXrefs: [],
      unknownRecords: [],
      notes: [],
    });
    expect(
      normalize(serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord))),
    ).toEqual(normalize(gedcomRecord));
  });
  it("more fields", () => {
    const gedcomText = [
      "0 @I1@ INDI",
      "1 NAME John /Doe/",
      "2 GIVN John",
      "2 SURN Doe",
      "2 SOUR @S1@",
      "2 SOUR @S2@",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    expect(parseGedcomIndividual(gedcomRecord)).toEqual({
      xref: "@I1@",
      childOfFamilyXrefs: [],
      events: [],
      parentOfFamilyXrefs: [],
      unknownRecords: [],
      notes: [],
      names: [
        {
          prefix: undefined,
          givenName: "John",
          nickName: undefined,
          surnamePrefix: undefined,
          surname: "Doe",
          suffix: undefined,
          nameType: undefined,
          notes: [],
          citations: [
            {
              sourceXref: "@S1@",
              multimediaLinks: [],
              notes: [],
              text: "",
              page: "",
              quality: "",
            },
            {
              sourceXref: "@S2@",
              multimediaLinks: [],
              notes: [],
              text: "",
              page: "",
              quality: "",
            },
          ],
        },
      ],
    });
    expect(
      normalize(serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord))),
    ).toEqual(normalize(gedcomRecord));
  });
});
