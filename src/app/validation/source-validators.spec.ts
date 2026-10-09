import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { sourceValidators } from "./source-validators";

describe("sourceValidators", () => {
  it("warns when a source's text contains a URL on a line by itself", () => {
    const source = newGedcomSource({
      xref: "S1",
      text: "https://example.com/record",
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.urlSuggestion).toEqual({
      fieldName: "text",
      url: "https://example.com/record",
      standalone: true,
      suggestedName: "example",
      matchedRepository: undefined,
    });
  });

  it("also warns when a URL is embedded alongside other text, but marks it not standalone", () => {
    const source = newGedcomSource({
      xref: "S1",
      text: "Record found at https://example.com/record",
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.urlSuggestion?.standalone).toBe(false);
  });

  it("warns when a source's abbreviation or title contains a URL", () => {
    const source = newGedcomSource({
      xref: "S1",
      abbr: "https://www.ancestry.com/abbr",
      title: "Census https://www.ancestry.com/title",
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings.map((warning) => warning.fieldName)).toEqual([
      "abbr",
      "title",
    ]);
    expect(result.warnings[0]?.urlSuggestion?.url).toBe(
      "https://www.ancestry.com/abbr",
    );
    expect(result.warnings[1]?.urlSuggestion?.url).toBe(
      "https://www.ancestry.com/title",
    );
  });

  it("warns separately for each URL when a field has more than one", () => {
    const source = newGedcomSource({
      xref: "S1",
      text: "https://example.com/foo\nhttps://example.org/bar",
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.warnings).toHaveLength(2);
    expect(
      result.warnings.map((warning) => warning.urlSuggestion?.url),
    ).toEqual(["https://example.com/foo", "https://example.org/bar"]);
  });

  it("suggests the matching repository when its name overlaps the domain", () => {
    const repository = newGedcomRepository({
      xref: "R1",
      name: "FamilySearch",
    });
    const source = newGedcomSource({
      xref: "S1",
      text: "https://www.familysearch.org/record",
    });
    const database = newGedcomDatabase({ repositories: { R1: repository } });

    const result = sourceValidators(source, database);

    expect(result.warnings[0]?.urlSuggestion?.matchedRepository).toBe(
      repository,
    );
  });

  it("skips an embedded URL that's just a prefix of a more complete URL elsewhere in the source", () => {
    const source = newGedcomSource({
      xref: "S1",
      title: [
        "https://www.findagrave.com/memorial/74983035/lennie-smylie",
        "http://sites.rootsweb.com/~msfrank2/smylie.htm",
        "",
        "Find a Grave, database and images (https://www.findagrave.com : accessed 10 October 2020)",
      ].join("\n"),
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(
      result.warnings.map((warning) => warning.urlSuggestion?.url),
    ).toEqual([
      "https://www.findagrave.com/memorial/74983035/lennie-smylie",
      "http://sites.rootsweb.com/~msfrank2/smylie.htm",
    ]);
  });

  it("doesn't suggest a change when the URL is already linked as a call number", () => {
    const source = newGedcomSource({
      xref: "S1",
      text: "https://example.com/record",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "R1",
          callNumbers: ["https://example.com/record"],
        }),
      ],
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.warnings).toEqual([]);
  });

  it("warns when a source has two repository citations for the same repository", () => {
    const repository = newGedcomRepository({ xref: "R1", name: "Example" });
    const source = newGedcomSource({
      xref: "S1",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "R1",
          callNumbers: ["one"],
        }),
        newGedcomRepositoryLink({
          repositoryXref: "R1",
          callNumbers: ["two"],
        }),
      ],
    });
    const database = newGedcomDatabase({ repositories: { R1: repository } });

    const result = sourceValidators(source, database);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.mergeRepositoryLinksSuggestion).toEqual({
      repositoryXref: "R1",
    });
    expect(result.warnings[0]?.message).toContain("Example");
  });

  it("doesn't warn when a source has only one citation per repository", () => {
    const source = newGedcomSource({
      xref: "S1",
      repositoryLinks: [
        newGedcomRepositoryLink({ repositoryXref: "R1", callNumbers: [] }),
        newGedcomRepositoryLink({ repositoryXref: "R2", callNumbers: [] }),
      ],
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.warnings).toEqual([]);
  });

  it("has no findings when nothing contains a URL", () => {
    const source = newGedcomSource({
      xref: "S1",
      abbr: "No link",
      title: "No link",
      text: "No link here",
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
