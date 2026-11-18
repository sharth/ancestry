import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { BibliographyWithoutTitleComponent } from "./bibliography-without-title.component";

function bibl(value: string) {
  return newGedcomRecord({ tag: "_BIBL", value });
}

describe("BibliographyWithoutTitleComponent", () => {
  async function renderWith(database: GedcomDatabase) {
    const { fixture } = await render(BibliographyWithoutTitleComponent, {
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

  it("fixes each source by moving the bibliography into the title", async () => {
    const source = newGedcomSource({
      xref: "@S1@",
      unknownRecords: [bibl("Bibliography")],
    });
    const component = await renderWith(
      newGedcomDatabase({ sources: { "@S1@": source } }),
    );
    const [row] = component.rows();
    expect(row?.editorTabs).toEqual([{ type: "SOUR", xref: "@S1@" }]);
    expect(row?.fixedDatabase.sources["@S1@"]?.title).toBe("Bibliography");
  });
});
