import { describe, expect, it } from "vitest";

import { newGedcomDate } from "./gedcomDate";
import {
  newGedcomFact,
  parseGedcomIndividualFact,
  serializeGedcomIndividualFact,
} from "./gedcomFact";
import { newGedcomRecord } from "./gedcomRecord";

// Facts are given an id when they are parsed.
const anyId = expect.any(Number) as number;

describe("gedcomEvent", () => {
  it("simple test case", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "BIRT",
      children: [newGedcomRecord({ tag: "DATE", value: "JAN 1 2025" })],
    });
    const gedcomEvent = parseGedcomIndividualFact(gedcomRecord);
    expect(gedcomEvent).toEqual(
      newGedcomFact({
        id: anyId,
        tag: "BIRT",
        date: newGedcomDate({ value: "JAN 1 2025" }),
      }),
    );
    expect(serializeGedcomIndividualFact(gedcomEvent)).toEqual(gedcomRecord);
  });

  it("Event without a date/place serializes with value Y", () => {
    const gedcomRecord = newGedcomRecord({ tag: "BIRT", value: "Y" });
    const gedcomEvent = parseGedcomIndividualFact(gedcomRecord);
    expect(gedcomEvent).toEqual(newGedcomFact({ id: anyId, tag: "BIRT" }));
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
        id: anyId,
        tag: "DEAT",
        date: newGedcomDate({ value: "JAN 1 2025" }),
      }),
    );
    expect(serializeGedcomIndividualFact(gedcomEvent)).toEqual(gedcomRecord);
  });

  it("gives each parsed fact its own id, which isn't serialized", () => {
    const gedcomRecord = newGedcomRecord({ tag: "BIRT", value: "Y" });
    const first = parseGedcomIndividualFact(gedcomRecord);
    const second = parseGedcomIndividualFact(gedcomRecord);
    expect(first.id).not.toBe(second.id);
    expect(serializeGedcomIndividualFact(first)).toEqual(gedcomRecord);
  });
});
