import { describe, expect, it } from "vitest";

import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import {
  extractUrl,
  findMatchingRepository,
  urlDomainLabel,
} from "./source-url.util";

describe("extractUrl", () => {
  it("finds a URL embedded in surrounding text", () => {
    expect(extractUrl("Available at https://example.com/foo see also")).toBe(
      "https://example.com/foo",
    );
  });

  it("returns undefined when there is no URL", () => {
    expect(extractUrl("just some plain text")).toBeUndefined();
  });

  it("stops at trailing punctuation and quotes", () => {
    expect(extractUrl('see "https://example.com/foo".')).toBe(
      "https://example.com/foo",
    );
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
