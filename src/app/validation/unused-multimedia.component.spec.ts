import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomMultimediaLink } from "../../gedcom/gedcomMultimediaLink";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { UnusedMultimediaComponent } from "./unused-multimedia.component";

describe("UnusedMultimediaComponent", () => {
  const multimedias = Object.fromEntries(
    ["@M1@", "@M2@", "@M3@", "@M4@", "@M5@"].map((xref) => [
      xref,
      newGedcomMultimedia({ xref, title: `Photo ${xref}` }),
    ]),
  );

  async function renderLinkNames(database: GedcomDatabase) {
    await render(UnusedMultimediaComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", signal(database))],
      waitForStableOnRender: true,
    });
    return screen.queryAllByRole("link").map((link) => link.textContent.trim());
  }

  it("says so when every multimedia is linked", async () => {
    await renderLinkNames(newGedcomDatabase({}));
    expect(screen.getByText(/Every multimedia object is linked/)).toBeTruthy();
  });

  it("links to each unused multimedia's page", async () => {
    await renderLinkNames(newGedcomDatabase({ multimedias }));
    const link = screen.getByRole("link", { name: "Photo @M1@" });
    expect(link.getAttribute("href")).toBe("/multimedia/@M1@");
  });

  it("leaves out multimedia linked from sources, citations and unparsed OBJE records", async () => {
    const citation = (xref: string) =>
      newGedcomSourceCitation({
        sourceXref: "@S1@",
        multimediaLinks: [newGedcomMultimediaLink({ xref })],
      });
    const individual = newGedcomIndividual({
      xref: "@I1@",
      unknownRecords: [newGedcomRecord({ tag: "OBJE", value: "@M3@" })],
    });
    individual.sex.citations.push(citation("@M2@"));
    const database = newGedcomDatabase({
      multimedias,
      individuals: { [individual.xref]: individual },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          citations: [citation("@M4@")],
        }),
      },
      sources: {
        "@S1@": newGedcomSource({
          xref: "@S1@",
          multimediaLinks: [newGedcomMultimediaLink({ xref: "@M1@" })],
        }),
      },
    });
    expect(await renderLinkNames(database)).toEqual(["Photo @M5@"]);
  });
});
