import { describe, expect, it } from "vitest";

import { newGedcomExternalIdentifier } from "./gedcomExternalIdentifier";
import {
  newGedcomIndividual,
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import { parseGedcomRecords, type GedcomRecord } from "./gedcomRecord";

function expectToBeDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("GedcomExternalIdentifier", () => {
  it("parses and serializes EXID with TYPE on an individual", () => {
    const gedcomText = [
      "0 @I1@ INDI",
      "1 EXID KWCB-QS1",
      "2 TYPE https://gedcom.io/exid-type/FamilySearch-PersonId",
      "1 EXID 142686057968",
      "2 TYPE https://www.ancestry.com/family-tree/person/tree/187758204/person/",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomIndividual(gedcomRecord)).toEqual(
      newGedcomIndividual({
        xref: "@I1@",
        externalIdentifiers: [
          newGedcomExternalIdentifier({
            id: "KWCB-QS1",
            type: "https://gedcom.io/exid-type/FamilySearch-PersonId",
          }),
          newGedcomExternalIdentifier({
            id: "142686057968",
            type: "https://www.ancestry.com/family-tree/person/tree/187758204/person/",
          }),
        ],
      }),
    );
    expect(
      serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });

  it("round-trips an EXID without TYPE", () => {
    const gedcomText = [
      "0 @I1@ INDI", //
      "1 EXID 123",
    ];
    const [gedcomRecord]: GedcomRecord[] = parseGedcomRecords(
      gedcomText.join("\n"),
    );
    expectToBeDefined(gedcomRecord);
    expect(parseGedcomIndividual(gedcomRecord).externalIdentifiers).toEqual([
      newGedcomExternalIdentifier({ id: "123" }),
    ]);
    expect(
      serializeGedcomIndividual(parseGedcomIndividual(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
});
