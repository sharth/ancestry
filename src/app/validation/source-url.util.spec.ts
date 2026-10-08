import { describe, expect, it } from "vitest";

import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import {
  extractUrls,
  findMatchingRepository,
  urlDomainLabel,
} from "./source-url.util";

describe("extractUrls", () => {
  it("finds a URL that's on a line by itself, marked standalone", () => {
    expect(extractUrls("https://example.com/foo")).toEqual([
      { url: "https://example.com/foo", standalone: true },
    ]);
  });

  it("finds a URL embedded alongside other text, marked not standalone", () => {
    expect(
      extractUrls("Available at https://example.com/foo see also"),
    ).toEqual([{ url: "https://example.com/foo", standalone: false }]);
  });

  it("stops at trailing punctuation and quotes", () => {
    expect(extractUrls('see "https://example.com/foo".')).toEqual([
      { url: "https://example.com/foo", standalone: false },
    ]);
  });

  it("returns an empty array when there is no URL", () => {
    expect(extractUrls("just some plain text")).toEqual([]);
  });

  it("finds every URL, tagging standalone vs. embedded lines independently", () => {
    expect(
      extractUrls(
        [
          "See the record below:",
          "https://example.com/foo",
          "Also mentioned inline: https://example.org/inline",
          "https://example.org/bar",
        ].join("\n"),
      ),
    ).toEqual([
      { url: "https://example.com/foo", standalone: true },
      { url: "https://example.org/inline", standalone: false },
      { url: "https://example.org/bar", standalone: true },
    ]);
  });

  it("trims surrounding whitespace before deciding a line is standalone", () => {
    expect(extractUrls("  https://example.com/foo  \n")).toEqual([
      { url: "https://example.com/foo", standalone: true },
    ]);
  });
});

describe("urlDomainLabel", () => {
  it("extracts the registrable domain label, ignoring www", () => {
    expect(urlDomainLabel("https://www.familysearch.org/search")).toBe(
      "familysearch",
    );
  });

  it("returns undefined for an invalid URL", () => {
    expect(urlDomainLabel("not a url")).toBeUndefined();
  });

  it("picks the distinctive label on a multi-level government host, not a short trailing one", () => {
    expect(
      urlDomainLabel(
        "http://www.digitalarchives.state.pa.us/archive.asp?view=ArchivePrint",
      ),
    ).toBe("digitalarchives");
  });
});

describe("findMatchingRepository", () => {
  it("matches a repository whose name contains the URL's domain label", () => {
    const repositories = {
      R1: newGedcomRepository({ xref: "R1", name: "FamilySearch" }),
    };
    expect(
      findMatchingRepository(
        "https://www.familysearch.org/record",
        repositories,
      ),
    ).toBe(repositories.R1);
  });

  it("matches when the domain label contains the repository's (shorter) name", () => {
    const repositories = {
      R1: newGedcomRepository({ xref: "R1", name: "Family" }),
    };
    expect(
      findMatchingRepository(
        "https://www.familysearch.org/record",
        repositories,
      ),
    ).toBe(repositories.R1);
  });

  it("returns undefined when no repository name overlaps the domain", () => {
    const repositories = {
      R1: newGedcomRepository({ xref: "R1", name: "Other Archive" }),
    };
    expect(
      findMatchingRepository("https://example.com", repositories),
    ).toBeUndefined();
  });

  it("ignores repositories with no name", () => {
    const repositories = { R1: newGedcomRepository({ xref: "R1" }) };
    expect(
      findMatchingRepository("https://example.com", repositories),
    ).toBeUndefined();
  });

  it("doesn't match an unrelated repository by a short trailing domain label", () => {
    const repositories = {
      R1: newGedcomRepository({ xref: "R1", name: "newspapers.com" }),
    };
    expect(
      findMatchingRepository(
        "http://www.digitalarchives.state.pa.us/archive.asp?view=ArchivePrint",
        repositories,
      ),
    ).toBeUndefined();
  });
});
