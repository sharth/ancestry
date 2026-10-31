import { inputBinding, signal, twoWayBinding } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputFactComponent } from "./input-fact.component";
import { InputIndividualFactsComponent } from "./input-individual-facts.component";

describe("InputIndividualFactsComponent", () => {
  let fixture: ComponentFixture<InputIndividualFactsComponent>;
  const openNewIndividual = vi.fn(() => "@I3@");
  const value = signal<GedcomDatabase>(newGedcomDatabase());

  function database(): GedcomDatabase {
    return newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          names: [newGedcomName({ givenName: "Mary", surname: "Jones" })],
          sex: newGedcomSex({ sex: "F" }),
          parentOfFamilyXrefs: ["@F1@"],
        }),
        "@I4@": newGedcomIndividual({
          xref: "@I4@",
          names: [newGedcomName({ givenName: "Ann", surname: "Smith" })],
        }),
      },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          husbandXref: "@I1@",
          wifeXref: "@I2@",
        }),
      },
    });
  }

  beforeEach(async () => {
    openNewIndividual.mockClear();
    value.set(database());
    const renderResult = await render(InputIndividualFactsComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(database())),
        inputBinding("individualXref", signal("@I1@")),
        twoWayBinding("value", value),
      ],
      providers: [{ provide: GEDCOM_EDITOR, useValue: { openNewIndividual } }],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
  });

  it("appends an individual event to the individual's own facts, and focuses it", async () => {
    const focusSpy = vi.spyOn(InputFactComponent.prototype, "focus");
    await userEvent.setup().click(screen.getByText("Append another event"));
    await fixture.whenStable();

    expect(value().individuals["@I1@"]?.facts.map((f) => f.tag)).toEqual([
      "EVEN",
    ]);
    expect(focusSpy).toHaveBeenCalled();
  });

  describe("couple events", () => {
    beforeEach(async () => {
      await userEvent.setup().click(screen.getByText(/Append a couple event/));
    });

    it("adds a marriage to the family the two already share", async () => {
      await userEvent
        .setup()
        .selectOptions(
          screen.getByRole("combobox", { name: "Spouse" }),
          "@I2@",
        );

      expect(Object.keys(value().families)).toEqual(["@F1@"]);
      expect(value().families["@F1@"]?.facts.map((f) => f.tag)).toEqual([
        "MARR",
      ]);
      expect(value().individuals["@I1@"]?.facts).toEqual([]);
    });

    it("creates a family, linked from both spouses, for a new couple", async () => {
      await userEvent
        .setup()
        .selectOptions(
          screen.getByRole("combobox", { name: "Spouse" }),
          "@I4@",
        );

      const family = value().families["@F2@"];
      expect(family?.husbandXref).toBe("@I1@");
      expect(family?.wifeXref).toBe("@I4@");
      expect(family?.facts.map((f) => f.tag)).toEqual(["MARR"]);
      expect(value().individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([
        "@F1@",
        "@F2@",
      ]);
      expect(value().individuals["@I4@"]?.parentOfFamilyXrefs).toEqual([
        "@F2@",
      ]);
    });

    it("can create a new person as the spouse", async () => {
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: /New/ }));

      expect(openNewIndividual).toHaveBeenCalled();
      expect(value().families["@F2@"]?.wifeXref).toBe("@I3@");
    });
  });
});
