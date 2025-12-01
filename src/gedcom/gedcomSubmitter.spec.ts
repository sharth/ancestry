import { type GedcomRecord, parseGedcomRecords } from "./gedcomRecord";
import {
  parseGedcomSubmitter,
  serializeGedcomSubmitter,
} from "./gedcomSubmitter";
import { describe, expect, it } from "vitest";

function parseGedcomRecordsFromArray(lines: string[]): GedcomRecord[] {
  return parseGedcomRecords(lines.join("\n"));
}

describe("GedcomSubmitter", () => {
  it("no fields", () => {
    const gedcomRecord: GedcomRecord = {
      tag: "SUBM",
      abstag: "SUBM",
      xref: "@SUBMITTER1@",
      value: "",
      children: [],
    };
    expect(parseGedcomSubmitter(gedcomRecord)).toEqual({
      xref: "@SUBMITTER1@",
      name: "",
      email: "",
    });
    expect(
      serializeGedcomSubmitter(parseGedcomSubmitter(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
  it("with details", () => {
    const [gedcomRecord] = parseGedcomRecordsFromArray([
      "0 @X2@ SUBM",
      "1 NAME John Doe",
      "1 _EMAIL johndoe@example.com",
    ]);
    expect(parseGedcomSubmitter(gedcomRecord)).toEqual({
      xref: "@X2@",
      name: "John Doe",
      email: "johndoe@example.com",
    });
    expect(
      serializeGedcomSubmitter(parseGedcomSubmitter(gedcomRecord)),
    ).toEqual(gedcomRecord);
  });
});
