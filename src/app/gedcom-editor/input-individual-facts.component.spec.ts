import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { InputIndividualFactComponent } from "./input-individual-fact.component";
import { InputIndividualFactsComponent } from "./input-individual-facts.component";

describe("InputIndividualFactsComponent", () => {
  let fixture: ComponentFixture<InputIndividualFactsComponent>;
  let component: InputIndividualFactsComponent;

  const mockDatabase: AncestryDatabase = {
    individuals: {},
    families: {},
    sources: {},
    multimedias: {},
    submitters: {},
    repositories: {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputIndividualFactsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputIndividualFactsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workingDatabase", mockDatabase);
    fixture.componentRef.setInput("open", true);
    fixture.detectChanges();
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
