import { produce } from "immer";
import { describe, expect, it, vi } from "vitest";

import type { AncestryService } from "../../database/ancestry.service";
import {
  compareGedcomDatabase,
  parseGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { parseGedcomRecords } from "../../gedcom/gedcomRecord";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { suggestionDifferences } from "./suggestion-differences.util";

// @S2@ lists TEXT before TITL, the reverse of the order the app writes, so
// it differs from the file even though no fix touches it.
const originalRecords = parseGedcomRecords(
  [
    "0 HEAD",
    "1 GEDC",
    "2 VERS 5.5.1",
    "0 @S1@ SOUR",
    "1 TITL First",
    "0 @S2@ SOUR",
    "1 TEXT Out of order",
    "1 TITL Second",
    "0 @S3@ SOUR",
    "1 TITL Third",
    "0 TRLR",
  ].join("\n"),
);
const database = parseGedcomDatabase(originalRecords);

function fakeAncestryService() {
  const compare = vi.fn((updated: GedcomDatabase) =>
    compareGedcomDatabase(originalRecords, updated),
  );
  return {
    compare,
    service: { compareGedcomDatabase: compare } as unknown as AncestryService,
  };
}

describe("suggestionDifferences", () => {
  it("lists only the records the fix changed, plus HEAD", () => {
    const { service } = fakeAncestryService();
    const updated = produce(database, (draft) => {
      const source = draft.sources["@S1@"];
      if (source !== undefined) source.title = "First, retitled";
      draft.repositories["@R1@"] = newGedcomRepository({
        xref: "@R1@",
        name: "Library",
      });
    });

    const differences = suggestionDifferences(service, database, updated);

    expect(
      differences.map(
        (d) =>
          `${(d.originalGedcomRecord ?? d.updatedGedcomRecord)?.tag} ${(d.originalGedcomRecord ?? d.updatedGedcomRecord)?.xref}`,
      ),
    ).toEqual(["HEAD ", "SOUR @S1@", "REPO @R1@"]);
    expect(differences[1]?.updatedGedcomRecord?.children[0]?.value).toBe(
      "First, retitled",
    );
    expect(differences[2]?.originalGedcomRecord).toBeUndefined();
  });

  it("lists a record the fix removed", () => {
    const { service } = fakeAncestryService();
    const updated = produce(database, (draft) => {
      delete draft.sources["@S3@"];
    });

    const differences = suggestionDifferences(service, database, updated);

    const removed = differences.filter((d) => d.updatedGedcomRecord == null);
    expect(removed.map((d) => d.originalGedcomRecord?.xref)).toEqual(["@S3@"]);
  });

  it("only hands the changed records to compareGedcomDatabase", () => {
    const { service, compare } = fakeAncestryService();
    const updated = produce(database, (draft) => {
      const source = draft.sources["@S1@"];
      if (source !== undefined) source.title = "First, retitled";
    });

    suggestionDifferences(service, database, updated);

    expect(compare).toHaveBeenCalledTimes(1);
    expect(Object.keys(compare.mock.calls[0]?.[0].sources ?? {})).toEqual([
      "@S1@",
    ]);
  });
});
