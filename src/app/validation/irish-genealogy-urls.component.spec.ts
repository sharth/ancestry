import { inputBinding, outputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource, type GedcomSource } from "../../gedcom/gedcomSource";
import { IrishGenealogyUrlsComponent } from "./irish-genealogy-urls.component";

const oldUrl =
  "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/9cbd434898349";
const newUrl = "https://www.irishgenealogy.ie/view/?record_id=cide-4898349";

const database = newGedcomDatabase({
  sources: {
    "@S1@": newGedcomSource({
      xref: "@S1@",
      abbr: "Death of John Doe",
      repositoryLinks: [
        newGedcomRepositoryLink({
          repositoryXref: "@R1@",
          callNumbers: [oldUrl],
        }),
      ],
    }),
    "@S2@": newGedcomSource({ xref: "@S2@" }),
  },
});

describe("IrishGenealogyUrlsComponent", () => {
  async function renderWith(
    gedcomDatabase: GedcomDatabase,
    reviewed: GedcomSource[] = [],
    submitted: GedcomSource[] = [],
    submittedAll: GedcomSource[][] = [],
  ) {
    await render(IrishGenealogyUrlsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(gedcomDatabase)),
        outputBinding<GedcomSource>("reviewSuggestion", (s) =>
          reviewed.push(s),
        ),
        outputBinding<GedcomSource>("submitSuggestion", (s) =>
          submitted.push(s),
        ),
        outputBinding<GedcomSource[]>("submitAllSuggestions", (s) =>
          submittedAll.push(s),
        ),
      ],
      waitForStableOnRender: true,
    });
  }

  it("says so when no call number is an old URL", async () => {
    await renderWith(
      newGedcomDatabase({
        sources: { "@S2@": newGedcomSource({ xref: "@S2@" }) },
      }),
    );
    expect(
      screen.getByText(
        "No call number is an old IrishGenealogy.ie civil record URL.",
      ),
    ).toBeTruthy();
  });

  it("links the source, the old URL and the new URL, with the proposed diff", async () => {
    await renderWith(database);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent.trim())).toEqual([
      "Death of John Doe",
      oldUrl,
      newUrl,
    ]);
    for (const link of links.slice(1)) {
      expect(link.getAttribute("href")).toBe(link.textContent.trim());
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    }
    expect(document.body.textContent).toContain(`2 CALN ${newUrl}`);
  });

  it("hands review, submit and submit all back to the page", async () => {
    const reviewed: GedcomSource[] = [];
    const submitted: GedcomSource[] = [];
    const submittedAll: GedcomSource[][] = [];
    await renderWith(database, reviewed, submitted, submittedAll);

    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();
    screen.getByRole("button", { name: "Submit changes as proposed" }).click();
    screen.getByRole("button", { name: "Submit all 1 as proposed" }).click();

    expect(reviewed.map((s) => s.xref)).toEqual(["@S1@"]);
    expect(submitted.map((s) => s.xref)).toEqual(["@S1@"]);
    expect(submittedAll.map((all) => all.map((s) => s.xref))).toEqual([
      ["@S1@"],
    ]);
  });
});
