import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { FamilyRelativesComponent } from "./family-relatives.component";

describe("FamilyRelativesComponent", () => {
  let component: FamilyRelativesComponent;
  let fixture: ComponentFixture<FamilyRelativesComponent>;

  beforeEach(async () => {
    const renderResult = await render(FamilyRelativesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", signal(newGedcomDatabase())),
        inputBinding("family", signal(newGedcomFamily({ xref: "@F1@" }))),
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
