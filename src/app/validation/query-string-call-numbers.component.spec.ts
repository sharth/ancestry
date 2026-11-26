import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  QueryStringCallNumbersComponent,
  queryStringCallNumbers,
  removeQueryStringCallNumbers,
} from "./query-string-call-numbers.component";

function source(
  xref: string,
  ...links: [repositoryXref: string, callNumbers: string[]][]
) {
  return newGedcomSource({
    xref,
    abbr: `Source ${xref}`,
    repositoryLinks: links.map(([repositoryXref, callNumbers]) =>
      newGedcomRepositoryLink({ repositoryXref, callNumbers }),
    ),
  });
}

function databaseOf(...sources: ReturnType<typeof source>[]) {
  return newGedcomDatabase({
    sources: Object.fromEntries(sources.map((s) => [s.xref, s])),
  });
}

describe("queryStringCallNumbers", () => {
  it("finds a URL repeated with a query string", () => {
    expect(
      queryStringCallNumbers(
        source("@S1@", [
          "@R1@",
          ["https://example.com/a", "https://example.com/a?b=1&c=2"],
        ]),
      ),
    ).toEqual([
      {
        withQuery: "https://example.com/a?b=1&c=2",
        withoutQuery: "https://example.com/a",
      },
    ]);
  });

  it("finds it across the source's repository links", () => {
    expect(
      queryStringCallNumbers(
        source(
          "@S1@",
          ["@R1@", ["https://example.com/a?b=1"]],
          ["@R2@", ["https://example.com/a"]],
        ),
      ),
    ).toEqual([
      {
        withQuery: "https://example.com/a?b=1",
        withoutQuery: "https://example.com/a",
      },
    ]);
  });

  it("ignores URLs that differ in more than the query string", () => {
    expect(
      queryStringCallNumbers(
        source("@S1@", [
          "@R1@",
          [
            "https://example.com/a",
            "https://example.com/b?x=1",
            "https://www.example.com/a?x=1",
            "http://example.com/a?x=1",
          ],
        ]),
      ),
    ).toEqual([]);
  });

  it("ignores a URL with a query string and no bare twin", () => {
    expect(
      queryStringCallNumbers(
        source("@S1@", [
          "@R1@",
          ["https://example.com/a?x=1", "https://example.com/a?x=2"],
        ]),
      ),
    ).toEqual([]);
  });

  it("ignores the same URLs on different sources", () => {
    const database = databaseOf(
      source("@S1@", ["@R1@", ["https://example.com/a"]]),
      source("@S2@", ["@R1@", ["https://example.com/a?x=1"]]),
    );
    expect(
      Object.values(database.sources).flatMap(queryStringCallNumbers),
    ).toEqual([]);
  });
});

describe("removeQueryStringCallNumbers", () => {
  it("removes the call number with the query string", () => {
    const database = databaseOf(
      source(
        "@S1@",
        ["@R1@", ["https://example.com/a?x=1", "Film 1"]],
        ["@R2@", ["https://example.com/a"]],
      ),
    );

    const fixed = removeQueryStringCallNumbers(database, ["@S1@"]);

    expect(fixed.sources["@S1@"]?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["Film 1"] },
      { repositoryXref: "@R2@", callNumbers: ["https://example.com/a"] },
    ]);
    expect(database.sources["@S1@"]?.repositoryLinks[0]?.callNumbers).toEqual([
      "https://example.com/a?x=1",
      "Film 1",
    ]);
  });
});

describe("QueryStringCallNumbersComponent", () => {
  async function renderRows(...sources: ReturnType<typeof source>[]) {
    await render(QueryStringCallNumbersComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          signal(
            newGedcomResourceValue({ gedcomDatabase: databaseOf(...sources) }),
          ),
        ),
      ],
      waitForStableOnRender: true,
    });
    return Array.from(document.querySelectorAll(".sticky-row")).map((row) =>
      Array.from(row.querySelectorAll('[role="cell"]'))
        .slice(0, 2)
        .map((cell) => cell.textContent.replace(/\s+/g, " ").trim())
        .join(" | "),
    );
  }

  it("says so when nothing is found", async () => {
    const rows = await renderRows(
      source("@S1@", ["@R1@", ["https://example.com/a"]]),
    );
    expect(rows).toEqual([]);
    expect(screen.getByText(/No call number repeats another/)).toBeTruthy();
  });

  it("lists the call number to remove and the one to keep", async () => {
    const rows = await renderRows(
      source("@S1@", [
        "@R1@",
        ["https://example.com/a", "https://example.com/a?x=1"],
      ]),
    );
    expect(rows).toEqual([
      "Source @S1@ | Removehttps://example.com/a?x=1Keephttps://example.com/a",
    ]);
    expect(
      screen.getByRole("link", { name: "Source @S1@" }).getAttribute("href"),
    ).toBe("/source/@S1@");
  });
});
