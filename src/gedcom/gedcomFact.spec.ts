import { describe, expect, it } from "vitest";
import {
  newGedcomFact,
  parseGedcomIndividualFact,
  serializeGedcomIndividualFact,
} from "./gedcomFact";
import { newGedcomRecord } from "./gedcomRecord";

describe("gedcomEvent", () => {
  it("simple test case", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "BIRT",
      children: [newGedcomRecord({ tag: "DATE", value: "JAN 1 2025" })],
    });
    const gedcomEvent = parseGedcomIndividualFact(gedcomRecord);
    expect(gedcomEvent).toEqual(
      newGedcomFact({
        tag: "BIRT",
        date: { value: "JAN 1 2025" },
      }),
    );
    expect(serializeGedcomIndividualFact(gedcomEvent)).toEqual(gedcomRecord);
  });

  it("Event without a date/place serializes with value Y", () => {
    const gedcomRecord = newGedcomRecord({ tag: "BIRT", value: "Y" });
    const gedcomEvent = parseGedcomIndividualFact(gedcomRecord);
    expect(gedcomEvent).toEqual(newGedcomFact({ tag: "BIRT" }));
    expect(serializeGedcomIndividualFact(gedcomEvent)).toEqual(gedcomRecord);
  });

  it("Event with a date serializes with an empty string as value", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "DEAT",
      children: [newGedcomRecord({ tag: "DATE", value: "JAN 1 2025" })],
    });
    const gedcomEvent = parseGedcomIndividualFact(gedcomRecord);
    expect(gedcomEvent).toEqual(
      newGedcomFact({
        tag: "DEAT",
        date: { value: "JAN 1 2025" },
      }),
    );
    expect(serializeGedcomIndividualFact(gedcomEvent)).toEqual(gedcomRecord);
  });
});
