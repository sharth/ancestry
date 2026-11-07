import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { DuplicateCallNumbersComponent } from "./duplicate-call-numbers.component";

describe("DuplicateCallNumbersComponent", () => {
  function source(xref: string, ...links: [string, string[]][]) {
    return newGedcomSource({
      xref,
      abbr: `Source ${xref}`,
      repositoryLinks: links.map(([repositoryXref, callNumbers]) =>
        newGedcomRepositoryLink({ repositoryXref, callNumbers }),
      ),
    });
  }

  async function renderRows(...sources: ReturnType<typeof source>[]) {
    await render(DuplicateCallNumbersComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              sources: Object.fromEntries(sources.map((s) => [s.xref, s])),
            }),
          ),
        ),
      ],
      waitForStableOnRender: true,
    });
    return screen
      .queryAllByRole("row")
      .slice(1)
      .map((row) =>
        [row.querySelector("td"), ...row.querySelectorAll("li")]
          .map((cell) => cell?.textContent.replace(/\s+/g, " ").trim())
          .join(" | "),
      );
  }

  it("says so when no call number repeats", async () => {
    const rows = await renderRows(
      source("@S1@", ["@R1@", ["Film 1"]]),
      source("@S2@", ["@R1@", ["Film 2"]]),
    );
    expect(rows).toEqual([]);
    expect(screen.getByText(/used only once/)).toBeTruthy();
  });

  it("flags a call number on two sources, linking each", async () => {
    const rows = await renderRows(
      source("@S1@", ["@R1@", ["Film 1"]]),
      source("@S2@", ["@R1@", ["Film 1"]]),
    );
    expect(rows).toEqual(["Film 1 | Source @S1@ | Source @S2@"]);
    const link = screen.getByRole("link", { name: "Source @S2@" });
    expect(link.getAttribute("href")).toBe("/source/@S2@");
  });

  it("flags duplicates under different repositories", async () => {
    const rows = await renderRows(
      source("@S1@", ["@R1@", ["Film 1"]]),
      source("@S2@", ["@R2@", ["Film 1"]]),
    );
    expect(rows).toEqual(["Film 1 | Source @S1@ | Source @S2@"]);
  });

  it("flags a call number repeated within one source", async () => {
    const rows = await renderRows(
      source("@S1@", ["@R1@", ["Film 1"]], ["@R2@", ["Film 1", "Film 2"]]),
    );
    expect(rows).toEqual(["Film 1 | Source @S1@ (2 times)"]);
  });
});
