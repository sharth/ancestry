import { inputBinding, outputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import {
  newGedcomIndividual,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { FamilySearchIdsComponent } from "./familysearch-ids.component";

function fsftid(value: string) {
  return newGedcomRecord({ tag: "_FSFTID", value });
}

describe("FamilySearchIdsComponent", () => {
  async function renderWith(
    database: GedcomDatabase,
    reviewed: GedcomIndividual[] = [],
    submitted: GedcomIndividual[] = [],
    submittedAll: GedcomIndividual[][] = [],
  ) {
    await render(FamilySearchIdsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(database)),
        outputBinding<GedcomIndividual>("reviewSuggestion", (i) =>
          reviewed.push(i),
        ),
        outputBinding<GedcomIndividual>("submitSuggestion", (i) =>
          submitted.push(i),
        ),
        outputBinding<GedcomIndividual[]>("submitAllSuggestions", (i) =>
          submittedAll.push(i),
        ),
      ],
      waitForStableOnRender: true,
    });
  }

  it("says so when no individual has a _FSFTID", async () => {
    await renderWith(
      newGedcomDatabase({
        individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
      }),
    );
    expect(
      screen.getByText(
        "No individual has a FamilySearch id in a _FSFTID record.",
      ),
    ).toBeTruthy();
  });

  it("lists each individual with a _FSFTID, with its proposed diff", async () => {
    await renderWith(
      newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            names: [newGedcomName({ givenName: "John", surname: "Doe" })],
            unknownRecords: [fsftid("KWCB-QS1")],
          }),
          "@I2@": newGedcomIndividual({ xref: "@I2@" }),
        },
      }),
    );
    expect(
      screen.queryAllByRole("link").map((link) => link.textContent.trim()),
    ).toEqual(["John Doe"]);
    expect(document.body.textContent).toContain("1 EXID KWCB-QS1");
    expect(document.body.textContent).toContain(
      "2 TYPE https://gedcom.io/exid-type/FamilySearch-PersonId",
    );
  });

  it("hands review, submit and submit all back to the page", async () => {
    const reviewed: GedcomIndividual[] = [];
    const submitted: GedcomIndividual[] = [];
    const submittedAll: GedcomIndividual[][] = [];
    await renderWith(
      newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            unknownRecords: [fsftid("KWCB-QS1")],
          }),
        },
      }),
      reviewed,
      submitted,
      submittedAll,
    );

    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();
    screen.getByRole("button", { name: "Submit changes as proposed" }).click();
    screen.getByRole("button", { name: "Submit all 1 as proposed" }).click();

    expect(reviewed.map((i) => i.xref)).toEqual(["@I1@"]);
    expect(submitted.map((i) => i.xref)).toEqual(["@I1@"]);
    expect(submittedAll.map((all) => all.map((i) => i.xref))).toEqual([
      ["@I1@"],
    ]);
  });
});
