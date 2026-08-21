import { describe, expect, it } from "vitest";
import {
  newGedcomIndividual,
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import { newGedcomName } from "./gedcomName";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "./gedcomRecord";
import { newGedcomSourceCitation } from "./gedcomSourceCitation";

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("gedcomIndividual", () => {
  it("no fields", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    expectToBeDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
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
    expectToBeDefined(gedcomRecord);
    const gedcomIndividual = parseGedcomIndividual(gedcomRecord);
    expect(gedcomIndividual).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
        changeDate: { date: { value: "1 JAN 1900" } },
        names: [
          newGedcomName({
            givenName: "John",
            surname: "Doe",
            citations: [
              newGedcomSourceCitation({ sourceXref: "@S1@" }),
              newGedcomSourceCitation({ sourceXref: "@S2@" }),
            ],
          }),
        ],
      }),
    );
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(gedcomIndividual)),
    ).toEqual(gedcomText);
  });
});
