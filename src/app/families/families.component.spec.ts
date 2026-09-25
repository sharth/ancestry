import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { FamiliesComponent } from "./families.component";

describe("FamiliesComponent", () => {
  let component: FamiliesComponent;
  let fixture: ComponentFixture<FamiliesComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(newGedcomDatabase());

    const renderResult = await render(FamiliesComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
