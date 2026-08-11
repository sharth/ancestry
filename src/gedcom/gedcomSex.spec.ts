import { describe, expect, it } from "vitest";
import {
  newGedcomIndividual,
  parseGedcomIndividual,
  serializeGedcomIndividual,
  type GedcomIndividual,
} from "./gedcomIndividual";
import { parseGedcomRecords, type GedcomRecord } from "./gedcomRecord";
import { newGedcomSex, serializeGedcomSex, type GedcomSex } from "./gedcomSex";

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("GedcomSex", () => {
  it("male", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
      "1 SEX M",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    const gedcomIndividual = newGedcomIndividual({
      xref: "@I1@",
      sex: newGedcomSex({ sex: "M" }),
    });
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomIndividual(gedcomRecord)).toEqual(gedcomIndividual);
    expect(
      serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("female", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
      "1 SEX F",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    const gedcomIndividual: GedcomIndividual = newGedcomIndividual({
      xref: "@I1@",
      sex: newGedcomSex({
        sex: "F",
      }),
    });
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomIndividual(gedcomRecord)).toEqual(gedcomIndividual);
    expect(
      serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("no sex", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    const gedcomIndividual: GedcomIndividual = newGedcomIndividual({
      xref: "@I1@",
      sex: newGedcomSex(),
    });
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomIndividual(gedcomRecord)).toEqual(gedcomIndividual);
    expect(
      serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("no details returns null", () => {
    const gedcomSex: GedcomSex = newGedcomSex();
    expect(serializeGedcomSex(gedcomSex)).toBeNull();
  });
});
