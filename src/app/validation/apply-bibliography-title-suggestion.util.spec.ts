import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  applyBibliographyTitleSuggestion,
  bibliographyForMissingTitle,
} from "./apply-bibliography-title-suggestion.util";

function bibl(value: string) {
  return newGedcomRecord({ tag: "_BIBL", value });
}

describe("bibliographyForMissingTitle", () => {
  it("returns the _BIBL value of a source without a title", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [bibl("Ancestry.com. 1881 England Census.")],
    });
    expect(bibliographyForMissingTitle(source)).toBe(
      "Ancestry.com. 1881 England Census.",
    );
  });

  it("returns undefined when the source already has a title", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      title: "1881 Census",
      unknownRecords: [bibl("Ancestry.com. 1881 England Census.")],
    });
    expect(bibliographyForMissingTitle(source)).toBeUndefined();
  });

  it("returns undefined without a _BIBL", () => {
    expect(
      bibliographyForMissingTitle(newGedcomSource({ xref: "@S1@" })),
    ).toBeUndefined();
  });

  it("returns undefined when the _BIBL has child records", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [
        newGedcomRecord({
          tag: "_BIBL",
          value: "Bibliography",
          children: [newGedcomRecord({ tag: "_X", value: "y" })],
        }),
      ],
    });
    expect(bibliographyForMissingTitle(source)).toBeUndefined();
  });
});

describe("applyBibliographyTitleSuggestion", () => {
  it("moves the _BIBL into the title, keeping other unknown records", () => {
    const other = newGedcomRecord({ tag: "_SUBQ", value: "Short" });
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [bibl("Parish register of St Mary."), other],
    });
    const database = newGedcomDatabase({ sources: { "@S1@": source } });

    const result = applyBibliographyTitleSuggestion(database, source);

    const updated = result.database.sources["@S1@"];
    expect(updated?.title).toBe("Parish register of St Mary.");
    expect(updated?.unknownRecords).toEqual([other]);
    expect(result.createdRepositoryXrefs).toEqual([]);
    // Pure: the original database is untouched.
    expect(database.sources["@S1@"]?.title).toBe("");
  });

  it("also links a repository for a URL in the moved bibliography, in the same edit", () => {
    const repository = newGedcomRepository({
      xref: "@R1@",
      name: "FamilySearch",
    });
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [
        bibl("1881 Census. https://www.familysearch.org/ark:/61903/1:1:ABCD"),
      ],
    });
    const database = newGedcomDatabase({
      sources: { "@S1@": source },
      repositories: { "@R1@": repository },
    });

    const result = applyBibliographyTitleSuggestion(database, source);

    const updated = result.database.sources["@S1@"];
    expect(updated?.title).toBe(
      "1881 Census. https://www.familysearch.org/ark:/61903/1:1:ABCD",
    );
    expect(updated?.repositoryLinks).toEqual([
      {
        repositoryXref: "@R1@",
        callNumbers: ["https://www.familysearch.org/ark:/61903/1:1:ABCD"],
      },
    ]);
  });

  it("creates a repository for a URL that matches none, and reports it", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [bibl("https://www.findagrave.com/memorial/1")],
    });
    const database = newGedcomDatabase({ sources: { "@S1@": source } });

    const result = applyBibliographyTitleSuggestion(database, source);

    expect(result.createdRepositoryXrefs).toEqual(["@R0@"]);
    expect(result.database.repositories["@R0@"]).toBeDefined();
  });

  it("leaves the database alone when there's nothing to move", () => {
    const source = newGedcomSource({ xref: "@S1@", title: "Has a title" });
    const database = newGedcomDatabase({ sources: { "@S1@": source } });
    expect(applyBibliographyTitleSuggestion(database, source).database).toBe(
      database,
    );
  });
});
