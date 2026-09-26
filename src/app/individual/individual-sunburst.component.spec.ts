import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualSunburstComponent } from "./individual-sunburst.component";

describe("IndividualSunburstComponent", () => {
  let component: IndividualSunburstComponent;
  let fixture: ComponentFixture<IndividualSunburstComponent>;

  beforeEach(async () => {
    const renderResult = await render(IndividualSunburstComponent, {
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
