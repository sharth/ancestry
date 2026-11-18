import { inputBinding, signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { newGedcomResourceValue } from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRecord } from "../../gedcom/gedcomRecord";
import { TreeIdsComponent } from "./tree-ids.component";

function fsftid(value: string) {
  return newGedcomRecord({ tag: "_FSFTID", value });
}

describe("TreeIdsComponent", () => {
  async function renderWith(database: GedcomDatabase) {
    const { fixture } = await render(TreeIdsComponent, {
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

  it("says so when no individual has a _FSFTID or _AMTID", async () => {
    await renderWith(
      newGedcomDatabase({
        individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
      }),
    );
    expect(
      screen.getByText(
        "No individual has a FamilySearch or Ancestry id in _FSFTID or _AMTID.",
      ),
    ).toBeTruthy();
  });

  it("lists each individual with a _FSFTID or _AMTID, with its proposed diff", async () => {
    await renderWith(
      newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            names: [newGedcomName({ givenName: "John", surname: "Doe" })],
            unknownRecords: [
              fsftid("KWCB-QS1"),
              newGedcomRecord({
                tag: "_AMTID",
                value: "132395462563:1030:183714515",
              }),
            ],
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
    expect(document.body.textContent).toContain("1 EXID 132395462563");
    expect(document.body.textContent).toContain(
      "2 TYPE https://www.ancestry.com/family-tree/person/tree/183714515/person/",
    );
    expect(screen.getByText("Ancestry 132395462563")).toBeTruthy();
  });

  it("fixes each individual in the editor, or all at once", async () => {
    const component = await renderWith(
      newGedcomDatabase({
        individuals: {
          "@I1@": newGedcomIndividual({
            xref: "@I1@",
            unknownRecords: [fsftid("KWCB-QS1")],
          }),
        },
      }),
    );
    const [row] = component.rows();
    expect(row?.editorTabs).toEqual([{ type: "INDI", xref: "@I1@" }]);
    expect(
      row?.fixedDatabase.individuals["@I1@"]?.externalIdentifiers,
    ).toHaveLength(1);
    expect(
      component.fixAll().individuals["@I1@"]?.externalIdentifiers,
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Submit all 1 as proposed" }),
    ).toBeTruthy();
  });
});
