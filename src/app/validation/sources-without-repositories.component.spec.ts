import { inputBinding, signal } from "@angular/core";
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
import { SourcesWithoutRepositoriesComponent } from "./sources-without-repositories.component";

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
});
