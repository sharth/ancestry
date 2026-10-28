import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { InputFamilyFactComponent } from "./input-family-fact.component";

describe("InputFamilyFactComponent", () => {
  let fixture: ComponentFixture<InputFamilyFactComponent>;
  let component: InputFamilyFactComponent;

  beforeEach(async () => {
    const workingDatabase = signal(newGedcomDatabase());
    const fact = signal(newGedcomFact());

    const renderResult = await render(InputFamilyFactComponent, {
      bindings: [
        inputBinding("workingDatabase", workingDatabase),
        inputBinding("value", fact),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should list fact types sorted alphabetically by their readable name", () => {
    const descriptions = component.gedcomEventTags.map(
      (event) => event.humanReadableDescription,
    );
    const sorted = [...descriptions].sort((a, b) => a.localeCompare(b));
    expect(descriptions).toEqual(sorted);
  });

  it("should render the tag select options sorted alphabetically", () => {
    const element = fixture.nativeElement as HTMLElement;
    const tagSelect = element.querySelector<HTMLSelectElement>("select#tag");
    assert.isOk(tagSelect);

    const optionLabels = [...tagSelect.options].map((option) => option.text);
    const sorted = [...optionLabels].sort((a, b) => a.localeCompare(b));
    expect(optionLabels).toEqual(sorted);
  });
});
