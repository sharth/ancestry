import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { sourceValidators } from "./source-validators";

describe("sourceValidators", () => {
  it("warns when a source's text contains a URL", () => {
    const source = newGedcomSource({
      xref: "S1",
      text: "Record found at https://example.com/record",
    });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]?.urlSuggestion).toEqual({
      fieldName: "text",
      url: "https://example.com/record",
      suggestedName: "example",
      matchedRepository: undefined,
    });
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
      text: "See https://example.com/foo and https://example.org/bar",
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
      text: "See https://www.familysearch.org/record",
    });
    const database = newGedcomDatabase({ repositories: { R1: repository } });

    const result = sourceValidators(source, database);

    expect(result.warnings[0]?.urlSuggestion?.matchedRepository).toBe(
      repository,
    );
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
