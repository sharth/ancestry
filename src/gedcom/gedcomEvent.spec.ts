import { describe, expect, it } from "vitest";
import {
  newGedcomEvent,
  parseGedcomIndividualEvent,
  serializeGedcomIndividualEvent,
} from "./gedcomEvent";
import { newGedcomRecord } from "./gedcomRecord";

describe("gedcomEvent", () => {
  it("simple test case", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "BIRT",
      children: [newGedcomRecord({ tag: "DATE", value: "JAN 1 2025" })],
    });
    const gedcomEvent = parseGedcomIndividualEvent(gedcomRecord);
    expect(gedcomEvent).toEqual(
      newGedcomEvent({
        tag: "BIRT",
        date: { value: "JAN 1 2025" },
      }),
    );
    expect(serializeGedcomIndividualEvent(gedcomEvent)).toEqual(gedcomRecord);
  });

  it("Event without a date/place serializes with value Y", () => {
    const gedcomRecord = newGedcomRecord({ tag: "BIRT", value: "Y" });
    const gedcomEvent = parseGedcomIndividualEvent(gedcomRecord);
    expect(gedcomEvent).toEqual(newGedcomEvent({ tag: "BIRT" }));
    expect(serializeGedcomIndividualEvent(gedcomEvent)).toEqual(gedcomRecord);
  });

  it("Event with a date serializes with an empty string as value", () => {
    const gedcomRecord = newGedcomRecord({
      tag: "DEAT",
      children: [newGedcomRecord({ tag: "DATE", value: "JAN 1 2025" })],
    });
    const gedcomEvent = parseGedcomIndividualEvent(gedcomRecord);
    expect(gedcomEvent).toEqual(
      newGedcomEvent({
        tag: "DEAT",
        date: { value: "JAN 1 2025" },
      }),
    );
    expect(serializeGedcomIndividualEvent(gedcomEvent)).toEqual(gedcomRecord);
  });
});
