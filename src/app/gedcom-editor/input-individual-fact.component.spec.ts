import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { InputIndividualFactComponent } from "./input-individual-fact.component";

describe("InputIndividualFactComponent", () => {
  let fixture: ComponentFixture<InputIndividualFactComponent>;
  let component: InputIndividualFactComponent;

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
      imports: [InputIndividualFactComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputIndividualFactComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workingDatabase", mockDatabase);
    fixture.componentRef.setInput("value", newGedcomFact());
    fixture.detectChanges();
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
