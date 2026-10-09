import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { applyUrlSuggestion } from "./apply-url-suggestion.util";

describe("applyUrlSuggestion", () => {
  it("links to the matched repository, with the URL as its call number, and strips a standalone URL from the text", () => {
    const repository = newGedcomRepository({
      xref: "@R1@",
      name: "FamilySearch",
    });
    const source = newGedcomSource({
      xref: "@S1@",
      text: "Record found at:\nhttps://www.familysearch.org/record",
    });
    const database = newGedcomDatabase({
      sources: { [source.xref]: source },
      repositories: { [repository.xref]: repository },
    });

    const result = applyUrlSuggestion(database, source, {
      fieldName: "text",
      url: "https://www.familysearch.org/record",
      standalone: true,
      suggestedName: "familysearch",
      matchedRepository: repository,
    });

    expect(result.repositoryXref).toBe("@R1@");
    const updatedSource = result.database.sources[source.xref];
    expect(updatedSource?.text).toBe("Record found at:");
    expect(updatedSource?.repositoryLinks).toEqual([
      {
        repositoryXref: "@R1@",
        callNumbers: ["https://www.familysearch.org/record"],
      },
    ]);
    // Doesn't add a second repository since one already matched.
    expect(Object.keys(result.database.repositories)).toEqual(["@R1@"]);
  });

  it("leaves the field text alone when the URL is embedded, not standalone", () => {
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
      fieldName: "text",
      url: "https://www.familysearch.org/record",
      standalone: false,
      suggestedName: "familysearch",
      matchedRepository: repository,
    });

    const updatedSource = result.database.sources[source.xref];
    expect(updatedSource?.text).toBe(
      "Record found at https://www.familysearch.org/record",
    );
    expect(updatedSource?.repositoryLinks).toEqual([
      {
        repositoryXref: "@R1@",
        callNumbers: ["https://www.familysearch.org/record"],
      },
    ]);
  });

  it("strips a standalone URL from the field the suggestion names, e.g. abbr", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      abbr: "https://example.com/abbr",
      title: "Some Title",
    });
    const database = newGedcomDatabase({ sources: { [source.xref]: source } });

    const result = applyUrlSuggestion(database, source, {
      fieldName: "abbr",
      url: "https://example.com/abbr",
      standalone: true,
      suggestedName: "example",
      matchedRepository: undefined,
    });

    const updatedSource = result.database.sources[source.xref];
    expect(updatedSource?.abbr).toBe("");
    expect(updatedSource?.title).toBe("Some Title");
  });

  it("creates a new repository when nothing matched", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      text: "See https://example.com/record",
    });
    const database = newGedcomDatabase({ sources: { [source.xref]: source } });

    const result = applyUrlSuggestion(database, source, {
      fieldName: "text",
      url: "https://example.com/record",
      standalone: false,
      suggestedName: "example",
      matchedRepository: undefined,
    });

    const newRepository = result.database.repositories[result.repositoryXref];
    expect(newRepository?.name).toBe("example");
    expect(result.database.sources[source.xref]?.repositoryLinks).toEqual([
      {
        repositoryXref: result.repositoryXref,
        callNumbers: [source.text.slice(4)],
      },
    ]);
  });

  it("appends a second distinct URL to the same repository as another call number on the existing link", () => {
    const repository = newGedcomRepository({
      xref: "@R1@",
      name: "ancestry.com",
    });
    const source = newGedcomSource({
      xref: "@S1@",
      title: "Source Citation\nhttps://www.ancestry.com/images/007_01869",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["https://www.ancestry.com/images/007_01868"],
        }),
      ],
    });
    const database = newGedcomDatabase({
      sources: { [source.xref]: source },
      repositories: { [repository.xref]: repository },
    });

    const result = applyUrlSuggestion(database, source, {
      fieldName: "title",
      url: "https://www.ancestry.com/images/007_01869",
      standalone: true,
      suggestedName: "ancestry.com",
      matchedRepository: repository,
    });

    const updatedSource = result.database.sources[source.xref];
    expect(updatedSource?.title).toBe("Source Citation");
    expect(updatedSource?.repositoryLinks).toEqual([
      {
        repositoryXref: "@R1@",
        callNumbers: [
          "https://www.ancestry.com/images/007_01868",
          "https://www.ancestry.com/images/007_01869",
        ],
      },
    ]);
  });

  it("doesn't add a duplicate call number when the URL already matches one on the existing link", () => {
    const repository = newGedcomRepository({
      xref: "@R1@",
      name: "ancestry.com",
    });
    const source = newGedcomSource({
      xref: "@S1@",
      title: "https://www.ancestry.com/images/007_01868",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["https://www.ancestry.com/images/007_01868"],
        }),
      ],
    });
    const database = newGedcomDatabase({
      sources: { [source.xref]: source },
      repositories: { [repository.xref]: repository },
    });

    const result = applyUrlSuggestion(database, source, {
      fieldName: "title",
      url: "https://www.ancestry.com/images/007_01868",
      standalone: true,
      suggestedName: "ancestry.com",
      matchedRepository: repository,
    });

    expect(result.database.sources[source.xref]?.repositoryLinks).toEqual([
      {
        repositoryXref: "@R1@",
        callNumbers: ["https://www.ancestry.com/images/007_01868"],
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
      fieldName: "text",
      url: "https://example.com",
      standalone: true,
      suggestedName: "example",
      matchedRepository: repository,
    });

    expect(database.sources[source.xref]?.text).toBe("https://example.com");
    expect(database.sources[source.xref]?.repositoryLinks).toEqual([]);
  });
});
