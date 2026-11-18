import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { SourceWarningsComponent } from "./source-warnings.component";

describe("SourceWarningsComponent", () => {
  const repository = newGedcomRepository({ xref: "@R1@", name: "Library" });

  async function renderWith(database: GedcomDatabase) {
    const { fixture } = await render(SourceWarningsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          signal(newGedcomResourceValue({ gedcomDatabase: database })),
        ),
      ],
      waitForStableOnRender: true,
    });
    return fixture.componentInstance;
  }

  it("says so when no source has an error or a warning", async () => {
    await renderWith(newGedcomDatabase());
    expect(
      screen.getByText("No source has an error or a warning."),
    ).toBeTruthy();
  });

  it("suggests a repository for a URL, with its preview", async () => {
    // S1 already cites a repository; a source with none shows its URL
    // suggestions in the "Sources without repositories" tab instead.
    const component = await renderWith(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            text: "Found at https://example.com/record",
            repositoryLinks: [
              newGedcomRepositoryLink({ repositoryXref: "@R1@" }),
            ],
          }),
        },
        repositories: { [repository.xref]: repository },
      }),
    );

    expect(
      Array.from(
        document.querySelectorAll('.header-row > [role="columnheader"]'),
      ).map((header) => header.textContent.trim()),
    ).toEqual(["Source", "Message", "Fix"]);
    expect(
      screen.getByRole("button", {
        name: "Open editor with proposed changes: Create repository",
      }),
    ).toBeTruthy();
    const [row] = component.rows();
    expect(row?.fixedDatabase?.repositories["@R2@"]?.name).toBe("example.com");
    // The source, then the repository the fix creates.
    expect(row?.editorTabs).toEqual([
      { type: "SOUR", xref: "@S1@" },
      { type: "REPO", xref: "@R2@" },
    ]);
    const text = document.body.textContent;
    expect(text).toContain("1 TEXT Found at https://example.com/record");
    expect(text).toContain("0 @R2@ REPO");
  });

  it("suggests merging two citations of one repository", async () => {
    const component = await renderWith(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
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
          }),
        },
        repositories: { [repository.xref]: repository },
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Open editor with proposed changes: Merge repository citations",
      }),
    ).toBeTruthy();
    const [row] = component.rows();
    expect(row?.fixedDatabase?.sources["@S1@"]?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["one", "two"] },
    ]);
    expect(row?.editorTabs).toEqual([{ type: "SOUR", xref: "@S1@" }]);
  });
});
