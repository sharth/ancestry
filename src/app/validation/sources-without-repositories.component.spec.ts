import { inputBinding, outputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  SourcesWithoutRepositoriesComponent,
  type SourceUrlSuggestions,
} from "./sources-without-repositories.component";

describe("SourcesWithoutRepositoriesComponent", () => {
  async function renderLinkNames(database: GedcomDatabase) {
    await render(SourcesWithoutRepositoriesComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", signal(database))],
      waitForStableOnRender: true,
    });
    return screen.queryAllByRole("link").map((link) => link.textContent.trim());
  }

  it("says so when every source cites a repository", async () => {
    await renderLinkNames(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            repositoryLinks: [
              newGedcomRepositoryLink({ repositoryXref: "@R1@" }),
            ],
          }),
        },
      }),
    );
    expect(
      screen.getByText("Every source cites at least one repository."),
    ).toBeTruthy();
  });

  it("links to each source without a repository, leaving out the rest", async () => {
    const names = await renderLinkNames(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            abbr: "Orphan",
            title: "No repo",
          }),
          "@S2@": newGedcomSource({ xref: "@S2@" }),
          "@S3@": newGedcomSource({
            xref: "@S3@",
            abbr: "Linked",
            repositoryLinks: [
              newGedcomRepositoryLink({ repositoryXref: "@R1@" }),
            ],
          }),
        },
      }),
    );
    expect(names).toEqual(["Orphan", "@S2@"]);
    const link = screen.getByRole("link", { name: "Orphan" });
    expect(link.getAttribute("href")).toBe("/source/@S1@");
    expect(screen.getByText("No repo")).toBeTruthy();
  });

  it("suggests a repository for each URL in a source without one", async () => {
    await renderLinkNames(
      newGedcomDatabase({
        repositories: {
          "@R1@": newGedcomRepository({
            xref: "@R1@",
            name: "FamilySearch",
          }),
        },
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            abbr: "Census",
            title: "Census https://www.familysearch.org/ark:/61903/1:1:X",
            text: "See https://www.newspapers.com/clip/1/",
          }),
        },
      }),
    );
    const existing = screen.getByRole("link", { name: "FamilySearch" });
    expect(existing.getAttribute("href")).toBe("/repository/@R1@");
    expect(screen.getByText(/New repository "newspapers.com"/)).toBeTruthy();
    expect(
      screen.getByText("(https://www.newspapers.com/clip/1/)"),
    ).toBeTruthy();
  });

  it("hands every suggestion for a source back as one edit", async () => {
    const source = newGedcomSource({
      xref: "@S1@",
      text: "https://www.newspapers.com/clip/1/\nhttps://www.newspapers.com/clip/2/",
    });
    const reviewed: SourceUrlSuggestions[] = [];
    const submitted: SourceUrlSuggestions[] = [];
    await render(SourcesWithoutRepositoriesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(newGedcomDatabase({ sources: { [source.xref]: source } })),
        ),
        outputBinding<SourceUrlSuggestions>("reviewUrlSuggestions", (e) =>
          reviewed.push(e),
        ),
        outputBinding<SourceUrlSuggestions>("submitUrlSuggestions", (e) =>
          submitted.push(e),
        ),
      ],
      waitForStableOnRender: true,
    });

    // One pair of buttons for the source, not one per URL.
    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();
    screen.getByRole("button", { name: "Submit changes as proposed" }).click();

    for (const events of [reviewed, submitted]) {
      expect(events).toHaveLength(1);
      expect(events[0]?.source).toBe(source);
      expect(events[0]?.suggestions.map((s) => s.url)).toEqual([
        "https://www.newspapers.com/clip/1/",
        "https://www.newspapers.com/clip/2/",
      ]);
    }
  });

  it("shows the before and proposed-after GEDCOM for the edit", async () => {
    await renderLinkNames(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            text: "Found at https://www.newspapers.com/clip/1/",
          }),
        },
      }),
    );
    const text = document.body.textContent;
    expect(text).toContain(
      "1 TEXT Found at https://www.newspapers.com/clip/1/",
    );
    expect(text).toContain("0 @R0@ REPO");
  });
});
