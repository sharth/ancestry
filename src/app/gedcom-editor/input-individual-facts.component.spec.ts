import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
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
