import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { applyMergeRepositoryLinksSuggestion } from "./apply-merge-repository-links-suggestion.util";

describe("applyMergeRepositoryLinksSuggestion", () => {
  it("merges two citations to the same repository into the first, combining call numbers", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["one"],
        }),
        newGedcomRepositoryLink({
          repositoryXref: "@R2@",
          callNumbers: ["unrelated"],
        }),
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["two"],
        }),
      ],
    });
    const database = newGedcomDatabase({ sources: { [source.xref]: source } });

    const result = applyMergeRepositoryLinksSuggestion(database, source, {
      repositoryXref: "@R1@",
    });

    expect(result.sources[source.xref]?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["one", "two"] },
      { repositoryXref: "@R2@", callNumbers: ["unrelated"] },
    ]);
  });

  it("doesn't duplicate a call number shared by both citations", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["shared"],
        }),
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["shared", "two"],
        }),
      ],
    });
    const database = newGedcomDatabase({ sources: { [source.xref]: source } });

    const result = applyMergeRepositoryLinksSuggestion(database, source, {
      repositoryXref: "@R1@",
    });

    expect(result.sources[source.xref]?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["shared", "two"] },
    ]);
  });

  it("doesn't mutate the original database", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["one"],
        }),
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: ["two"],
        }),
      ],
    });
    const database = newGedcomDatabase({ sources: { [source.xref]: source } });

    applyMergeRepositoryLinksSuggestion(database, source, {
      repositoryXref: "@R1@",
    });

    expect(database.sources[source.xref]?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["one"] },
      { repositoryXref: "@R1@", callNumbers: ["two"] },
    ]);
  });
});
