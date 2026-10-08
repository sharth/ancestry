import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { applyUrlSuggestion } from "./apply-url-suggestion.util";

describe("applyUrlSuggestion", () => {
  it("links to the matched repository, with the URL as its call number, and strips the URL from the text", () => {
    const repository = newGedcomRepository({
      xref: "@R1@",
      name: "FamilySearch",
    });
    const source = newGedcomSource({
      xref: "@S1@",
      text: "Record found at https://www.familysearch.org/record",
    });
    const database = newGedcomDatabase({
      sources: { [source.xref]: source },
      repositories: { [repository.xref]: repository },
    });

    const result = applyUrlSuggestion(database, source, {
      url: "https://www.familysearch.org/record",
      suggestedName: "familysearch",
      matchedRepository: repository,
    });

    expect(result.repositoryXref).toBe("@R1@");
    const updatedSource = result.database.sources[source.xref];
    expect(updatedSource?.text).toBe("Record found at");
    expect(updatedSource?.repositoryLinks).toEqual([
      {
        repositoryXref: "@R1@",
        callNumber: "https://www.familysearch.org/record",
      },
    ]);
    // Doesn't add a second repository since one already matched.
    expect(Object.keys(result.database.repositories)).toEqual(["@R1@"]);
  });

  it("creates a new repository when nothing matched", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      text: "See https://example.com/record",
    });
    const database = newGedcomDatabase({ sources: { [source.xref]: source } });

    const result = applyUrlSuggestion(database, source, {
      url: "https://example.com/record",
      suggestedName: "example",
      matchedRepository: undefined,
    });

    const newRepository = result.database.repositories[result.repositoryXref];
    expect(newRepository?.name).toBe("example");
    expect(result.database.sources[source.xref]?.repositoryLinks).toEqual([
      {
        repositoryXref: result.repositoryXref,
        callNumber: source.text.slice(4),
      },
    ]);
  });

  it("doesn't mutate the original database", () => {
    const repository = newGedcomRepository({ xref: "@R1@", name: "Example" });
    const source = newGedcomSource({
      xref: "@S1@",
      text: "https://example.com",
    });
    const database = newGedcomDatabase({
      sources: { [source.xref]: source },
      repositories: { [repository.xref]: repository },
    });

    applyUrlSuggestion(database, source, {
      url: "https://example.com",
      suggestedName: "example",
      matchedRepository: repository,
    });

    expect(database.sources[source.xref]?.text).toBe("https://example.com");
    expect(database.sources[source.xref]?.repositoryLinks).toEqual([]);
  });
});
