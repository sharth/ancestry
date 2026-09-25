import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { InputIndividualFactComponent } from "./input-individual-fact.component";

describe("InputIndividualFactComponent", () => {
  let fixture: ComponentFixture<InputIndividualFactComponent>;
  let component: InputIndividualFactComponent;

  beforeEach(async () => {
    const workingDatabase = signal(newGedcomDatabase());
    const fact = signal(newGedcomFact());

    const renderResult = await render(InputIndividualFactComponent, {
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

  it("should focus the tag select element when focus() is called", () => {
    const element = fixture.nativeElement as HTMLElement;
    const tagSelect = element.querySelector<HTMLSelectElement>("select#tag");
    assert.isOk(tagSelect);

    component.focus();
    expect(document.activeElement).toBe(tagSelect);
  });
});
