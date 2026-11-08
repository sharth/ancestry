import { inputBinding, outputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomSource, type GedcomSource } from "../../gedcom/gedcomSource";
import { BibliographyWithoutTitleComponent } from "./bibliography-without-title.component";

function bibl(value: string) {
  return newGedcomRecord({ tag: "_BIBL", abstag: "SOUR._BIBL", value });
}

describe("BibliographyWithoutTitleComponent", () => {
  async function renderWith(
    database: GedcomDatabase,
    reviewed: GedcomSource[] = [],
    submitted: GedcomSource[] = [],
  ) {
    await render(BibliographyWithoutTitleComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(database)),
        outputBinding<GedcomSource>("reviewSuggestion", (s) =>
          reviewed.push(s),
        ),
        outputBinding<GedcomSource>("submitSuggestion", (s) =>
          submitted.push(s),
        ),
      ],
      waitForStableOnRender: true,
    });
  }

  it("says so when no untitled source has a bibliography", async () => {
    await renderWith(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            title: "Titled",
            unknownRecords: [bibl("Bibliography")],
          }),
          "@S2@": newGedcomSource({ xref: "@S2@" }),
        },
      }),
    );
    expect(
      screen.getByText(
        "Every source with a bibliography (_BIBL) also has a title.",
      ),
    ).toBeTruthy();
  });

  it("lists each untitled source with a bibliography, with its proposed diff", async () => {
    await renderWith(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({
            xref: "@S1@",
            abbr: "Census",
            unknownRecords: [bibl("Ancestry.com. 1881 England Census.")],
          }),
          "@S2@": newGedcomSource({
            xref: "@S2@",
            abbr: "Titled",
            title: "Has one",
            unknownRecords: [bibl("Other")],
          }),
        },
      }),
    );
    expect(
      screen.queryAllByRole("link").map((link) => link.textContent.trim()),
    ).toEqual(["Census"]);
    expect(
      screen.getAllByText("Ancestry.com. 1881 England Census.").length,
    ).toBeGreaterThan(0);
    expect(document.body.textContent).toContain(
      "1 TITL Ancestry.com. 1881 England Census.",
    );
  });

  it("hands review and submit back to the page", async () => {
    const reviewed: GedcomSource[] = [];
    const submitted: GedcomSource[] = [];
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [bibl("Bibliography")],
    });
    await renderWith(
      newGedcomDatabase({ sources: { "@S1@": source } }),
      reviewed,
      submitted,
    );

    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();
    screen.getByRole("button", { name: "Submit changes as proposed" }).click();

    expect(reviewed.map((s) => s.xref)).toEqual(["@S1@"]);
    expect(submitted.map((s) => s.xref)).toEqual(["@S1@"]);
  });
});
