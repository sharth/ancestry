import { inputBinding, signal, type Provider } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
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

  beforeEach(async () => {
    openFamily.mockClear();
    await renderWithFamilies([
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
});

describe("InputIndividualComponent family buttons without an editor", () => {
  it("disables the buttons", async () => {
    await renderWithFamilies([]);
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
