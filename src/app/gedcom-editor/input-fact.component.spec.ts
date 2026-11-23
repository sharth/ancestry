import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, within } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyFacts,
  gedcomIndividualFacts,
} from "../../gedcom/gedcomFactMetadata";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
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
    const tagSelect = within(element).getByLabelText<HTMLSelectElement>("Tag");
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
    const tagSelect = within(element).getByLabelText<HTMLSelectElement>("Tag");
    assert.isOk(tagSelect);

    const optionLabels = [...tagSelect.options].map((option) => option.text);
    const sorted = [...optionLabels].sort((a, b) => a.localeCompare(b));
    expect(optionLabels).toEqual(sorted);
  });

  it("offers the given fact types", async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tagValues = () =>
      [...within(element).getByLabelText<HTMLSelectElement>("Tag").options].map(
        (option) => option.value,
      );
    expect(tagValues()).toContain("BIRT");
    expect(tagValues()).not.toContain("MARR");

    tags.set(gedcomFamilyFacts);
    await fixture.whenStable();
    expect(tagValues()).toContain("MARR");
    expect(tagValues()).not.toContain("BIRT");
  });
});

describe("InputFactComponent fact type lock", () => {
  async function renderFact(saved: boolean) {
    const fact = newGedcomFact({ tag: "BIRT" });
    const { fixture } = await render(InputFactComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(newGedcomDatabase())),
        inputBinding("value", signal(fact)),
        inputBinding("tags", signal(gedcomIndividualFacts)),
      ],
      providers: [
        {
          provide: GEDCOM_EDITOR,
          useValue: {
            savedFactIds: signal(new Set(saved ? [fact.id] : [])),
          },
        },
      ],
      waitForStableOnRender: true,
    });
    return fixture.nativeElement as HTMLElement;
  }

  it("shows a saved fact's type read-only", async () => {
    const element = await renderFact(true);
    const tag = within(element).getByLabelText<HTMLInputElement>("Tag");
    expect(tag.tagName).toBe("INPUT");
    expect(tag.readOnly).toBe(true);
    expect(tag.value).toBe("Birth");
  });

  it("lets a new fact choose its type", async () => {
    const element = await renderFact(false);
    const tag = within(element).getByLabelText("Tag");
    expect(tag.tagName).toBe("SELECT");
  });
});
