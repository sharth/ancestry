import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualSourcesComponent } from "./individual-sources.component";

describe("IndividualSourcesComponent", () => {
  let component: IndividualSourcesComponent;
  let fixture: ComponentFixture<IndividualSourcesComponent>;

  beforeEach(async () => {
    const renderResult = await render(IndividualSourcesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
            }),
          ),
        ),
        inputBinding("xref", signal("@I1@")),
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
