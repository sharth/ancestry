import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { InputIndividualFactComponent } from "./input-individual-fact.component";

describe("InputIndividualFactComponent", () => {
  let fixture: ComponentFixture<InputIndividualFactComponent>;
  let component: InputIndividualFactComponent;

  beforeEach(async () => {
    fixture = TestBed.createComponent(InputIndividualFactComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workingDatabase", newGedcomDatabase());
    fixture.componentRef.setInput("value", newGedcomFact());
    await fixture.whenStable();
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
