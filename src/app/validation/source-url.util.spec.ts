import { describe, expect, it } from "vitest";

import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import {
  extractUrl,
  findMatchingRepository,
  normalizeUrl,
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

describe("normalizeUrl", () => {
  it("strips scheme, www, and a trailing slash", () => {
    expect(normalizeUrl("https://www.Example.com/Foo/")).toBe(
      "example.com/foo",
    );
  });

  it("returns undefined for an invalid URL", () => {
    expect(normalizeUrl("not a url")).toBeUndefined();
  });
});

describe("findMatchingRepository", () => {
  it("matches a repository with the same URL regardless of scheme or www", () => {
    const repositories = {
      R1: newGedcomRepository({
        xref: "R1",
        url: "http://www.example.com/foo",
      }),
    };
    expect(
      findMatchingRepository("https://example.com/foo/", repositories),
    ).toBe(repositories.R1);
  });

  it("falls back to a same-host match when the path differs", () => {
    const repositories = {
      R1: newGedcomRepository({ xref: "R1", url: "https://example.com/bar" }),
    };
    expect(
      findMatchingRepository("https://example.com/foo", repositories),
    ).toBe(repositories.R1);
  });

  it("returns undefined when no repository has a matching host", () => {
    const repositories = {
      R1: newGedcomRepository({ xref: "R1", url: "https://other.com" }),
    };
    expect(
      findMatchingRepository("https://example.com", repositories),
    ).toBeUndefined();
  });

  it("ignores repositories with no URL recorded", () => {
    const repositories = { R1: newGedcomRepository({ xref: "R1" }) };
    expect(
      findMatchingRepository("https://example.com", repositories),
    ).toBeUndefined();
  });
});
