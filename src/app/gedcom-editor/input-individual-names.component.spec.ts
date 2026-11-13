import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputIndividualNamesComponent } from "./input-individual-names.component";

describe("InputIndividualNamesComponent", () => {
  let fixture: ComponentFixture<InputIndividualNamesComponent>;
  let component: InputIndividualNamesComponent;

  beforeEach(async () => {
    const renderResult = await render(InputIndividualNamesComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
