import {
  inputBinding,
  signal,
  twoWayBinding,
  type Provider,
} from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
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
// (@I3@) and Tom (@I4@) aren't related to anyone, and aren't in the form.
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

// The form only holds John and his families, as in the editor.
function formValue(): GedcomDatabase {
  const { individuals, families } = database();
  const john = individuals["@I1@"];
  assert.isOk(john);
  return newGedcomDatabase({ individuals: { "@I1@": john }, families });
}

describe("InputIndividualFamiliesComponent", () => {
  let fixture: ComponentFixture<InputIndividualFamiliesComponent>;
  const openFamily = vi.fn();
  const value = signal<GedcomDatabase>(newGedcomDatabase());

  async function renderFamilies(providers: Provider[]) {
    value.set(formValue());
    const renderResult = await render(InputIndividualFamiliesComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(database())),
        inputBinding("individualXref", signal("@I1@")),
        twoWayBinding("value", value),
      ],
      providers,
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
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

  it("changes the other spouse, updating both spouses' links", async () => {
    await userEvent
      .setup()
      .selectOptions(screen.getByRole("combobox", { name: "Spouse" }), "@I3@");

    expect(value().families["@F2@"]?.wifeXref).toBe("@I3@");
    expect(value().individuals["@I2@"]?.parentOfFamilyXrefs).toEqual([]);
    expect(value().individuals["@I3@"]?.parentOfFamilyXrefs).toEqual(["@F2@"]);
  });

  it("adds and removes a child, on both sides", async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText("Add child"));
    // Every individual picker's select has the same id, so its label doesn't
    // name it; find the select next to the "Child" label instead.
    const childPicker = screen
      .getByText("Child", { selector: "label" })
      .parentElement?.querySelector("select");
    assert.isOk(childPicker);
    await user.selectOptions(childPicker, "@I4@");
    await fixture.whenStable();

    expect(value().families["@F2@"]?.childXrefs).toEqual(["@I4@"]);
    expect(value().individuals["@I4@"]?.childOfFamilyXrefs).toEqual(["@F2@"]);

    await user.click(screen.getByRole("button", { name: "Remove child" }));

    expect(value().families["@F2@"]?.childXrefs).toEqual([]);
    expect(value().individuals["@I4@"]?.childOfFamilyXrefs).toEqual([]);
  });

  it("adds an event to the spouse family", async () => {
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
        inputBinding("value", signal(formValue())),
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
