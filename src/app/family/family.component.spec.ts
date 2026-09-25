import { inputBinding } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { FamilyComponent } from "./family.component";

describe("FamilyComponent", () => {
  let component: FamilyComponent;
  let fixture: ComponentFixture<FamilyComponent>;

  beforeEach(async () => {
    const ancestryDatabase = newGedcomDatabase({
      families: {
        "@F1@": newGedcomFamily({ xref: "@F1@" }),
      },
    });

    const renderResult = await render(FamilyComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("ancestryDatabase", () => ancestryDatabase),
        inputBinding("xref", () => "@F1@"),
      ],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
