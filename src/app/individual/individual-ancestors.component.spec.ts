import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualAncestorsComponent } from "./individual-ancestors.component";

describe("IndividualAncestorsComponent", () => {
  let component: IndividualAncestorsComponent;
  let fixture: ComponentFixture<IndividualAncestorsComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
      }),
    );
    const xref = signal("@I1@");

    const renderResult = await render(IndividualAncestorsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", ancestryDatabase),
        inputBinding("xref", xref),
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
