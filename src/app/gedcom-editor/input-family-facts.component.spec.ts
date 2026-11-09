import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import { InputFactComponent } from "./input-fact.component";
import { InputFamilyFactsComponent } from "./input-family-facts.component";

describe("InputFamilyFactsComponent", () => {
  let fixture: ComponentFixture<InputFamilyFactsComponent>;
  let component: InputFamilyFactsComponent;

  const workingDatabase = signal(newGedcomDatabase());
  const open = signal(true);
  const value = signal<GedcomFact[]>([]);

  beforeEach(async () => {
    value.set([newGedcomFact({ tag: "MARR" })]);
    const renderResult = await render(InputFamilyFactsComponent, {
      bindings: [
        inputBinding("workingDatabase", workingDatabase),
        inputBinding("open", open),
        inputBinding("value", value),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows one section per event, labeled with its tag", () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("summary")?.textContent).toContain(
      "Events (1)",
    );
    const eventDetails =
      element.querySelectorAll<HTMLDetailsElement>("details > details");
    expect(eventDetails).toHaveLength(1);
    expect(eventDetails[0]?.querySelector("summary")?.textContent).toContain(
      "MARR",
    );
  });

  it("should open newly appended event details by default and focus the fact component", async () => {
    const user = userEvent.setup();
    const element = fixture.nativeElement as HTMLElement;
    const focusSpy = vi.spyOn(InputFactComponent.prototype, "focus");

    const factsContainer = element.querySelector<HTMLDetailsElement>("details");
    assert.isOk(factsContainer);
    expect(factsContainer.open).toBe(true);

    const addEventButton = factsContainer.querySelector(
      'button[aria-label="Add event"]',
    );
    assert.isOk(addEventButton);

    await user.click(addEventButton);
    await fixture.whenStable();

    expect(component.value()).toHaveLength(2);
    const newFactDetails = factsContainer.querySelector<HTMLDetailsElement>(
      ":scope > details:last-of-type",
    );
    assert.isOk(newFactDetails);
    expect(newFactDetails.open).toBe(true);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("removes the event whose Remove button is clicked", async () => {
    const user = userEvent.setup();
    const element = fixture.nativeElement as HTMLElement;
    const removeButton = element.querySelector(
      'button[aria-label="Remove event"]',
    );
    assert.isOk(removeButton);

    await user.click(removeButton);
    await fixture.whenStable();

    expect(component.value()).toEqual([]);
    expect(element.querySelectorAll("details > details")).toHaveLength(0);
  });
});
