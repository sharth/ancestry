import { inputBinding } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, it } from "vitest";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualGedcomComponent } from "./individual-gedcom.component";

describe("IndividualGedcomComponent", () => {
  let component: IndividualGedcomComponent;
  let fixture: ComponentFixture<IndividualGedcomComponent>;

  beforeEach(async () => {
    const mockDatabase: GedcomDatabase = {
      individuals: {
        "@I1@": newGedcomIndividual({ xref: "@I1@" }),
      },
      families: {},
      sources: {},
      repositories: {},
      multimedias: {},
      submitters: {},
    };

    const renderResult = await render(IndividualGedcomComponent, {
      bindings: [
        inputBinding("ancestryDatabase", () => mockDatabase),
        inputBinding("xref", () => "@I1@"),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
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
