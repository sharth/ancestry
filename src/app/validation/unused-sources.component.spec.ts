import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import { UnusedSourcesComponent } from "./unused-sources.component";

describe("UnusedSourcesComponent", () => {
  const sources = Object.fromEntries(
    ["@S1@", "@S2@", "@S3@", "@S4@"].map((xref) => [
      xref,
      newGedcomSource({ xref, abbr: `Source ${xref}` }),
    ]),
  );

  function citing(sourceXref: string) {
    return [newGedcomSourceCitation({ sourceXref })];
  }

  async function renderLinkNames(database: GedcomDatabase) {
    await render(UnusedSourcesComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", signal(database))],
      waitForStableOnRender: true,
    });
    return screen.queryAllByRole("link").map((link) => link.textContent.trim());
  }

  it("says so when every source is cited", async () => {
    await renderLinkNames(newGedcomDatabase({}));
    expect(screen.getByText(/Every source is cited/)).toBeTruthy();
  });

  it("links each unused source to its page", async () => {
    await renderLinkNames(newGedcomDatabase({ sources }));
    const link = screen.getByRole("link", { name: "Source @S1@" });
    expect(link.getAttribute("href")).toBe("/source/@S1@");
  });

  it("counts citations on individual facts, names and sex", async () => {
    const names = await renderLinkNames(
      newGedcomDatabase({
        sources,
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            facts: [newGedcomFact({ tag: "BIRT", citations: citing("@S1@") })],
            names: [newGedcomName({ citations: citing("@S2@") })],
            sex: newGedcomSex({ citations: citing("@S3@") }),
          }),
        },
      }),
    );
    expect(names).toEqual(["Source @S4@"]);
  });

  it("counts citations on families and family facts", async () => {
    const names = await renderLinkNames(
      newGedcomDatabase({
        sources,
        families: {
          "@F1@": newGedcomFamily({
            xref: "@F1@",
            citations: citing("@S1@"),
            facts: [newGedcomFact({ tag: "MARR", citations: citing("@S2@") })],
          }),
        },
      }),
    );
    expect(names).toEqual(["Source @S3@", "Source @S4@"]);
  });

  it("counts citations kept in unknown records", async () => {
    const names = await renderLinkNames(
      newGedcomDatabase({
        sources,
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            unknownRecords: [newGedcomRecord({ tag: "SOUR", value: "@S1@" })],
          }),
        },
      }),
    );
    expect(names).toEqual(["Source @S2@", "Source @S3@", "Source @S4@"]);
  });
});
