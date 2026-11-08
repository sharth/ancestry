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
import {
  databaseDifferences,
  suggestionDifferences,
  type GedcomRecordDifference,
} from "./suggestion-differences.util";

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

function labels(differences: GedcomRecordDifference[]) {
  return differences.map((d) => {
    const record = d.originalGedcomRecord ?? d.updatedGedcomRecord;
    return `${record?.tag} ${record?.xref}`;
  });
}

describe("suggestionDifferences", () => {
  const retitleAndAddRepository = produce(database, (draft) => {
    const source = draft.sources["@S1@"];
    if (source !== undefined) source.title = "First, retitled";
    draft.repositories["@R1@"] = newGedcomRepository({
      xref: "@R1@",
      name: "Library",
    });
  });

  it("matches the diff of the whole fixed database, untouched records included", () => {
    const { service } = fakeAncestryService();
    const baseline = databaseDifferences(service, database);

    const differences = suggestionDifferences(
      service,
      database,
      baseline,
      retitleAndAddRepository,
    );

    // @S2@ isn't touched by the fix, but saving would still rewrite it.
    expect(labels(differences)).toEqual([
      "HEAD ",
      "SOUR @S1@",
      "SOUR @S2@",
      "REPO @R1@",
    ]);
    expect(labels(differences)).toEqual(
      labels(databaseDifferences(service, retitleAndAddRepository)),
    );
    expect(differences[1]?.updatedGedcomRecord?.children[0]?.value).toBe(
      "First, retitled",
    );
  });

  it("lists a record the fix removed", () => {
    const { service } = fakeAncestryService();
    const updated = produce(database, (draft) => {
      delete draft.sources["@S3@"];
    });

    const differences = suggestionDifferences(
      service,
      database,
      databaseDifferences(service, database),
      updated,
    );

    const removed = differences.filter((d) => d.updatedGedcomRecord == null);
    expect(removed.map((d) => d.originalGedcomRecord?.xref)).toEqual(["@S3@"]);
  });

  it("only hands the changed records to compareGedcomDatabase", () => {
    const { service, compare } = fakeAncestryService();
    const baseline = databaseDifferences(service, database);
    compare.mockClear();

    suggestionDifferences(service, database, baseline, retitleAndAddRepository);

    expect(compare).toHaveBeenCalledTimes(1);
    const compared = compare.mock.calls[0]?.[0];
    expect(Object.keys(compared?.sources ?? {})).toEqual(["@S1@"]);
    expect(Object.keys(compared?.repositories ?? {})).toEqual(["@R1@"]);
  });
});
