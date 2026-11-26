import { produce } from "immer";
import { describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
import {
  compareGedcomDatabase,
  diffGedcomDatabase,
  parseGedcomDatabase,
  serializeGedcomDatabase,
} from "./gedcomDatabase";
import {
  parseGedcomRecords,
  serializeGedcomRecordToText,
  type GedcomRecord,
} from "./gedcomRecord";
import { newGedcomRepository } from "./gedcomRepository";

describe("compareGedcomDatabase change dates", () => {
  const originalGedcomRecords = parseGedcomRecords(
    [
      "0 HEAD",
      "1 GEDC",
      "2 VERS 7.0.18",
      "0 @I1@ INDI",
      "1 SEX M",
      "1 CHAN",
      "2 DATE 5 AUG 2020",
      "0 @S1@ SOUR",
      "1 TITL Old title",
      "1 CHAN",
      "2 DATE 5 AUG 2020",
      "0 TRLR",
    ].join("\n"),
  );
  const originalDatabase = parseGedcomDatabase(originalGedcomRecords);
  const now = new Date(2030, 0, 2);

  function updatedText(updated: ReturnType<typeof parseGedcomDatabase>) {
    return compareGedcomDatabase(
      originalGedcomRecords,
      originalDatabase,
      updated,
      now,
    )
      .map(({ updatedGedcomRecord }) => updatedGedcomRecord)
      .filter((record): record is GedcomRecord => record !== undefined)
      .filter((record) => record.tag !== "HEAD")
      .map((record) => serializeGedcomRecordToText(record).join("\n"));
  }

  it("stamps an edited record and leaves unedited records alone", () => {
    const updated = produce(originalDatabase, (draft) => {
      const source = draft.sources["@S1@"];
      if (source) source.title = "New title";
    });

    expect(updatedText(updated)).toEqual(
      expect.arrayContaining([
        ["0 @I1@ INDI", "1 SEX M", "1 CHAN", "2 DATE 5 AUG 2020"].join("\n"),
        ["0 @S1@ SOUR", "1 TITL New title", "1 CHAN", "2 DATE 2 JAN 2030"].join(
          "\n",
        ),
      ]),
    );
  });

  it("stamps a newly added record's change and creation dates", () => {
    const updated = produce(originalDatabase, (draft) => {
      draft.repositories["@R1@"] = newGedcomRepository({
        xref: "@R1@",
        name: "FamilySearch",
      });
    });

    expect(updatedText(updated)).toContain(
      [
        "0 @R1@ REPO",
        "1 NAME FamilySearch",
        "1 CHAN",
        "2 DATE 2 JAN 2030",
        "1 CREA",
        "2 DATE 2 JAN 2030",
      ].join("\n"),
    );
  });

  it("serializes with the same now for HEAD and CHAN", () => {
    const updated = produce(originalDatabase, (draft) => {
      const source = draft.sources["@S1@"];
      if (source) source.title = "New title";
    });

    const text = serializeGedcomDatabase(
      originalGedcomRecords,
      originalDatabase,
      updated,
      now,
    ).join("\n");
    expect(text).toContain("1 DATE 2 JAN 2030");
    expect(text).toContain(
      ["0 @S1@ SOUR", "1 TITL New title", "1 CHAN", "2 DATE 2 JAN 2030"].join(
        "\n",
      ),
    );
  });

  it("stamps nothing when nothing was edited", () => {
    const text = updatedText(originalDatabase).join("\n");
    expect(text).not.toContain("2 JAN 2030");
    expect(originalDatabase.sources["@S1@"]?.changeDate).toEqual(
      newGedcomChangeDate({ value: "5 AUG 2020" }),
    );
  });
});

describe("diffGedcomDatabase", () => {
  const originalGedcomRecords = parseGedcomRecords(
    [
      "0 HEAD",
      "1 GEDC",
      "2 VERS 7.0.18",
      "0 @I1@ INDI",
      "1 SEX M",
      "0 @I2@ INDI",
      "1 SEX F",
      "0 @S1@ SOUR",
      "1 TITL Old title",
      "0 TRLR",
    ].join("\n"),
  );
  const originalDatabase = parseGedcomDatabase(originalGedcomRecords);
  const updated = produce(originalDatabase, (draft) => {
    const source = draft.sources["@S1@"];
    if (source) source.title = "New title";
    delete draft.individuals["@I1@"];
    draft.repositories["@R1@"] = newGedcomRepository({ xref: "@R1@" });
  });

  // HEAD is left out: it's regenerated (and so differs) on every compare.
  function changedXrefs(alwaysIncludeXrefs?: ReadonlySet<string>) {
    return diffGedcomDatabase(
      originalGedcomRecords,
      originalDatabase,
      updated,
      alwaysIncludeXrefs,
    )
      .filter(
        ({ originalGedcomRecord, updatedGedcomRecord }) =>
          (originalGedcomRecord ?? updatedGedcomRecord)?.tag !== "HEAD",
      )
      .map(
        ({ originalGedcomRecord, updatedGedcomRecord }) =>
          originalGedcomRecord?.xref ?? updatedGedcomRecord?.xref,
      );
  }

  it("lists only the records that would be written differently", () => {
    // Removed, edited and added; the unchanged @I2@ and TRLR are left out.
    expect(changedXrefs()).toEqual(["@I1@", "@S1@", "@R1@"]);
  });

  it("also lists an unchanged record whose xref is always included", () => {
    expect(changedXrefs(new Set(["@I2@"]))).toEqual([
      "@I1@",
      "@I2@",
      "@S1@",
      "@R1@",
    ]);
  });
});
