import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputIndividualComponent } from "./input-individual.component";

describe("InputIndividualComponent", () => {
  let fixture: ComponentFixture<InputIndividualComponent>;
  let component: InputIndividualComponent;

  beforeEach(async () => {
    const renderResult = await render(InputIndividualComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
