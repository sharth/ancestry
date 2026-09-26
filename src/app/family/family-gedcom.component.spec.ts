import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { FamilyGedcomComponent } from "./family-gedcom.component";

describe("FamilyGedcomComponent", () => {
  let component: FamilyGedcomComponent;
  let fixture: ComponentFixture<FamilyGedcomComponent>;

  beforeEach(async () => {
    const renderResult = await render(FamilyGedcomComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "ancestryDatabase",
          signal(
            newGedcomDatabase({
              families: { "@F1@": newGedcomFamily({ xref: "@F1@" }) },
            }),
          ),
        ),
        inputBinding("xref", signal("@F1@")),
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
