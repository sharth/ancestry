import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { assert, beforeEach, describe, it } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualGedcomComponent } from "./individual-gedcom.component";

describe("IndividualGedcomComponent", () => {
  let component: IndividualGedcomComponent;
  let fixture: ComponentFixture<IndividualGedcomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualGedcomComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndividualGedcomComponent);
    component = fixture.componentInstance;

    const mockDatabase: AncestryDatabase = {
      individuals: {
        "@I1@": newGedcomIndividual({ xref: "@I1@" }),
      },
      families: {},
      sources: {},
      repositories: {},
      multimedias: {},
      submitters: {},
    };

    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);
    fixture.componentRef.setInput("xref", "@I1@");
    fixture.detectChanges();
  });

  it("should create", () => {
    assert.isOk(component);
  });

  it("should display gedcom heading and gedcom-display component", () => {
    const element = fixture.nativeElement as HTMLElement;
    const heading = element.querySelector("h2");
    assert.isOk(heading);
    assert.equal(heading.textContent, "Gedcom");

    const gedcomDisplay = element.querySelector("app-gedcom-display");
    assert.isOk(gedcomDisplay);
  });
});
