import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyFacts,
  gedcomIndividualFacts,
} from "../../gedcom/gedcomFactMetadata";
import { InputFactComponent } from "./input-fact.component";

describe("InputFactComponent", () => {
  let fixture: ComponentFixture<InputFactComponent>;
  let component: InputFactComponent;
  const tags = signal(gedcomIndividualFacts);

  beforeEach(async () => {
    tags.set(gedcomIndividualFacts);
    const workingDatabase = signal(newGedcomDatabase());
    const fact = signal(newGedcomFact());

    const renderResult = await render(InputFactComponent, {
      bindings: [
        inputBinding("workingDatabase", workingDatabase),
        inputBinding("value", fact),
        inputBinding("tags", tags),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should focus the tag select element when focus() is called", () => {
    const element = fixture.nativeElement as HTMLElement;
    const tagSelect = element.querySelector<HTMLSelectElement>("select#tag");
    assert.isOk(tagSelect);

    component.focus();
    expect(document.activeElement).toBe(tagSelect);
  });

  it("should list fact types sorted alphabetically by their readable name", () => {
    const descriptions = component
      .gedcomEventTags()
      .map((event) => event.humanReadableDescription);
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

  it("offers the given fact types", async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tagValues = () =>
      [
        ...(element.querySelector<HTMLSelectElement>("select#tag")?.options ??
          []),
      ].map((option) => option.value);
    expect(tagValues()).toContain("BIRT");
    expect(tagValues()).not.toContain("MARR");

    tags.set(gedcomFamilyFacts);
    await fixture.whenStable();
    expect(tagValues()).toContain("MARR");
    expect(tagValues()).not.toContain("BIRT");
  });
});
