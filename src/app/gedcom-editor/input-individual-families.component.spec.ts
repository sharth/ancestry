import {
  inputBinding,
  signal,
  twoWayBinding,
  type Provider,
} from "@angular/core";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputIndividualFamiliesComponent } from "./input-individual-families.component";

// John (@I1@) is a child of @F1@ and married to Mary (@I2@) in @F2@. Ann
// (@I3@) and Tom (@I4@) aren't related to anyone.
function database(): GedcomDatabase {
  return newGedcomDatabase({
    individuals: {
      "@I1@": newGedcomIndividual({
        xref: "@I1@",
        names: [newGedcomName({ givenName: "John", surname: "Smith" })],
        childOfFamilyXrefs: ["@F1@"],
        parentOfFamilyXrefs: ["@F2@"],
      }),
      "@I2@": newGedcomIndividual({
        xref: "@I2@",
        names: [newGedcomName({ givenName: "Mary", surname: "Jones" })],
        sex: newGedcomSex({ sex: "F" }),
        parentOfFamilyXrefs: ["@F2@"],
      }),
      "@I3@": newGedcomIndividual({
        xref: "@I3@",
        names: [newGedcomName({ givenName: "Ann", surname: "Smith" })],
      }),
      "@I4@": newGedcomIndividual({
        xref: "@I4@",
        names: [newGedcomName({ givenName: "Tom", surname: "Smith" })],
      }),
    },
    families: {
      "@F1@": newGedcomFamily({ xref: "@F1@", childXrefs: ["@I1@"] }),
      "@F2@": newGedcomFamily({
        xref: "@F2@",
        husbandXref: "@I1@",
        wifeXref: "@I2@",
      }),
    },
  });
}

describe("InputIndividualFamiliesComponent", () => {
  const openFamily = vi.fn();
  const value = signal<GedcomDatabase>(newGedcomDatabase());

  async function renderFamilies(providers: Provider[]) {
    value.set(database());
    await render(InputIndividualFamiliesComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(database())),
        inputBinding("individualXref", signal("@I1@")),
        twoWayBinding("value", value),
      ],
      providers,
      waitForStableOnRender: true,
    });
  }

  beforeEach(async () => {
    openFamily.mockClear();
    await renderFamilies([
      { provide: GEDCOM_EDITOR, useValue: { openFamily } },
    ]);
  });

  it("opens the spouse family, labelled with the other spouse", () => {
    const button = screen.getByRole("button", { name: /Spouse in/ });
    expect(button.textContent).toContain("Mary /Jones/");
    button.click();
    expect(openFamily).toHaveBeenCalledWith("@F2@");
  });

  it("opens the family the individual is a child of", () => {
    screen.getByRole("button", { name: /Child of/ }).click();
    expect(openFamily).toHaveBeenCalledWith("@F1@");
  });

  it("removes the individual from a family they are a child of, on both sides", async () => {
    const [childOf] = screen.getAllByRole("button", {
      name: "Remove from family",
    });
    assert.isOk(childOf);
    await userEvent.setup().click(childOf);

    expect(value().families["@F1@"]?.childXrefs).toEqual([]);
    expect(value().individuals["@I1@"]?.childOfFamilyXrefs).toEqual([]);
  });

  it("removes the individual as a spouse, on both sides", async () => {
    const [, spouseIn] = screen.getAllByRole("button", {
      name: "Remove from family",
    });
    assert.isOk(spouseIn);
    await userEvent.setup().click(spouseIn);

    expect(value().families["@F2@"]?.husbandXref).toBe("");
    expect(value().families["@F2@"]?.wifeXref).toBe("@I2@");
    expect(value().individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([]);
  });

  it("adds a new family with the individual as a spouse", async () => {
    await userEvent
      .setup()
      .click(screen.getByText("Add a family with this person as a spouse"));

    expect(value().families["@F3@"]?.husbandXref).toBe("@I1@");
    expect(value().individuals["@I1@"]?.parentOfFamilyXrefs).toEqual([
      "@F2@",
      "@F3@",
    ]);
  });

  it("edits each spouse family with the family editor", async () => {
    await userEvent.setup().click(screen.getByText("Append another event"));

    expect(value().families["@F2@"]?.facts).toHaveLength(1);
  });
});

describe("InputIndividualFamiliesComponent without an editor", () => {
  it("disables the open buttons", async () => {
    await render(InputIndividualFamiliesComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(database())),
        inputBinding("individualXref", signal("@I1@")),
        inputBinding("value", signal(database())),
      ],
      waitForStableOnRender: true,
    });
    expect(screen.getByRole("button", { name: /Spouse in/ })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: /Child of/ })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
