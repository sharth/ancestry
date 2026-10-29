import { inputBinding, signal, type Provider } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputIndividualComponent } from "./input-individual.component";

describe("InputIndividualComponent", () => {
  let fixture: ComponentFixture<InputIndividualComponent>;
  let component: InputIndividualComponent;

  beforeEach(async () => {
    const renderResult = await render(InputIndividualComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

function renderWithFamilies(providers: Provider[]) {
  const database = newGedcomDatabase();
  const john = newGedcomIndividual({
    xref: "@I1@",
    names: [newGedcomName({ givenName: "John", surname: "Smith" })],
    childOfFamilyXrefs: ["@F1@"],
    parentOfFamilyXrefs: ["@F2@"],
  });
  const mary = newGedcomIndividual({
    xref: "@I2@",
    names: [newGedcomName({ givenName: "Mary", surname: "Jones" })],
  });
  database.individuals = { "@I1@": john, "@I2@": mary };
  database.families = {
    "@F1@": newGedcomFamily({ xref: "@F1@" }),
    "@F2@": newGedcomFamily({
      xref: "@F2@",
      husbandXref: "@I1@",
      wifeXref: "@I2@",
    }),
  };

  return render(InputIndividualComponent, {
    bindings: [
      inputBinding("workingDatabase", signal(database)),
      inputBinding("value", signal(john)),
    ],
    providers,
    waitForStableOnRender: true,
  });
}

describe("InputIndividualComponent family buttons", () => {
  const openFamily = vi.fn();
  const addSpouse = vi.fn();

  beforeEach(async () => {
    openFamily.mockClear();
    addSpouse.mockClear();
    await renderWithFamilies([
      {
        provide: GEDCOM_EDITOR,
        useValue: { openFamily, addSpouse, familyFactsField: () => undefined },
      },
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

  it("offers everyone but the individual as a spouse", () => {
    const picker = screen.getByRole<HTMLSelectElement>("combobox", {
      name: "Choose a spouse",
    });
    const options = Array.from(picker.options).map((option) => option.value);
    expect(options).toEqual(["", "@I2@"]);
  });

  it("adds the chosen spouse through the editor", async () => {
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Choose a spouse" }),
      "@I2@",
    );
    screen.getByRole("button", { name: /Add Spouse/ }).click();
    expect(addSpouse).toHaveBeenCalledWith("@I1@", "@I2@");
  });
});

describe("InputIndividualComponent family buttons without an editor", () => {
  it("disables the buttons and hides the spouse picker", async () => {
    await renderWithFamilies([]);
    expect(screen.getByRole("button", { name: /Spouse in/ })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: /Child of/ })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.queryByRole("button", { name: /Add Spouse/ })).toBeNull();
  });
});
