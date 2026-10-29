import { inputBinding, signal, twoWayBinding } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputIndividualFactComponent } from "./input-individual-fact.component";
import { InputIndividualFactsComponent } from "./input-individual-facts.component";

describe("InputIndividualFactsComponent", () => {
  let fixture: ComponentFixture<InputIndividualFactsComponent>;
  let component: InputIndividualFactsComponent;

  const workingDatabase = signal(newGedcomDatabase());
  const open = signal(true);

  beforeEach(async () => {
    const renderResult = await render(InputIndividualFactsComponent, {
      bindings: [
        inputBinding("workingDatabase", workingDatabase),
        inputBinding("open", open),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open newly appended event details by default and focus the fact component", async () => {
    const user = userEvent.setup();
    const element = fixture.nativeElement as HTMLElement;
    const focusSpy = vi.spyOn(InputIndividualFactComponent.prototype, "focus");

    const factsContainer = element.querySelector<HTMLDetailsElement>("details");
    assert.isOk(factsContainer);
    expect(factsContainer.open).toBe(true);

    const addEventButton = factsContainer.querySelector(
      'button[aria-label="Add event"]',
    );
    assert.isOk(addEventButton);

    await user.click(addEventButton);
    await fixture.whenStable();

    const newFactDetails = factsContainer.querySelector<HTMLDetailsElement>(
      ":scope > details:last-of-type",
    );
    assert.isOk(newFactDetails);
    expect(newFactDetails.open).toBe(true);
    expect(focusSpy).toHaveBeenCalled();
  });
});

describe("InputIndividualFactsComponent new events in the editor", () => {
  const addFactToSpouseFamily = vi.fn();
  const value = signal<GedcomFact[]>([]);

  beforeEach(async () => {
    addFactToSpouseFamily.mockClear();
    value.set([]);
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({ xref: "@I1@" }),
        "@I2@": newGedcomIndividual({
          xref: "@I2@",
          names: [newGedcomName({ givenName: "Mary", surname: "Jones" })],
        }),
      },
    });
    await render(InputIndividualFactsComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(database)),
        inputBinding("individualXref", signal("@I1@")),
        twoWayBinding("value", value),
      ],
      providers: [
        {
          provide: GEDCOM_EDITOR,
          useValue: {
            familyFactsField: () => undefined,
            addFactToSpouseFamily,
          },
        },
      ],
      waitForStableOnRender: true,
    });
    await userEvent.setup().click(screen.getByText("Append another event"));
  });

  it("adds a marriage to the family shared with the chosen spouse", async () => {
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tag" }),
      "MARR",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Spouse" }),
      "@I2@",
    );
    expect(addFactToSpouseFamily).toHaveBeenCalledWith(
      "@I1@",
      "@I2@",
      newGedcomFact({ tag: "MARR" }),
    );
    expect(value()).toEqual([]);
  });

  it("adds an individual event to the individual's own facts", async () => {
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tag" }),
      "BIRT",
    );
    expect(value().map((fact) => fact.tag)).toEqual(["BIRT"]);
    expect(screen.queryByRole("combobox", { name: "Spouse" })).toBeNull();
    expect(addFactToSpouseFamily).not.toHaveBeenCalled();
  });
});
