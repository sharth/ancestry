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
    xref: record.xref,
    value: record.value,
    children: record.children.map(normalize),
  };
}

describe("gedcomIndividual", () => {
  it("no fields", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    expect(parseGedcomIndividual(gedcomRecord)).toEqual({
      xref: "@I1@",
      names: [],
      sex: { sex: "", citations: [] },
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
      "1 CHAN",
      "2 DATE 1 JAN 1900",
    ];
    const [gedcomRecord] = parseGedcomRecords(gedcomText.join("\n"));
    expect(parseGedcomIndividual(gedcomRecord)).toEqual({
      xref: "@I1@",
      sex: { sex: "", citations: [] },
      changeDate: {
        date: { value: "1 JAN 1900" },
      },
      childOfFamilyXrefs: [],
      events: [],
      parentOfFamilyXrefs: [],
      unknownRecords: [],
      notes: [],
      names: [
        {
          prefix: "",
          givenName: "John",
          nickName: "",
          surnamePrefix: "",
          surname: "Doe",
          suffix: "",
          nameType: "",
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
