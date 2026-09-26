import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualRelativesComponent } from "./individual-relatives.component";

describe("IndividualRelativesComponent", () => {
  let component: IndividualRelativesComponent;
  let fixture: ComponentFixture<IndividualRelativesComponent>;

  beforeEach(async () => {
    const renderResult = await render(IndividualRelativesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(newGedcomDatabase())),
        inputBinding(
          "individual",
          signal(newGedcomIndividual({ xref: "@I1@" })),
        ),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
