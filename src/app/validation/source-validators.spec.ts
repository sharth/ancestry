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
      url: "https://example.com/record",
      matchedRepository: undefined,
    });
  });

  it("suggests the matching repository when one already has that URL", () => {
    const repository = newGedcomRepository({
      xref: "R1",
      name: "Example Archive",
      url: "https://example.com",
    });
    const source = newGedcomSource({
      xref: "S1",
      text: "See https://example.com/record",
    });
    const database = newGedcomDatabase({ repositories: { R1: repository } });

    const result = sourceValidators(source, database);

    expect(result.warnings[0]?.urlSuggestion?.matchedRepository).toBe(
      repository,
    );
  });

  it("has no findings when the text has no URL", () => {
    const source = newGedcomSource({ xref: "S1", text: "No link here" });
    const result = sourceValidators(source, newGedcomDatabase());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
