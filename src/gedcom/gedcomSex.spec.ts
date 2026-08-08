import type { GedcomIndividual } from "./gedcomIndividual";
import {
  newGedcomIndividual,
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import { type GedcomRecord, parseGedcomRecords } from "./gedcomRecord";
import type { GedcomSex } from "./gedcomSex";
import { serializeGedcomSex } from "./gedcomSex";
import { describe, expect, it } from "vitest";

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
    const gedcomIndividual = {
      ...newGedcomIndividual("@I1@"),
      sex: {
        sex: "M",
        citations: [],
      },
    };
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
    const gedcomIndividual: GedcomIndividual = {
      ...newGedcomIndividual("@I1@"),
      sex: {
        sex: "F",
        citations: [],
      },
    };
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
    const gedcomIndividual: GedcomIndividual = {
      ...newGedcomIndividual("@I1@"),
      sex: {
        sex: "",
        citations: [],
      },
    };
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomIndividual(gedcomRecord)).toEqual(gedcomIndividual);
    expect(
      serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("no details returns null", () => {
    const gedcomSex: GedcomSex = {
      sex: "",
      citations: [],
    };
    expect(serializeGedcomSex(gedcomSex)).toBeNull();
  });
});
