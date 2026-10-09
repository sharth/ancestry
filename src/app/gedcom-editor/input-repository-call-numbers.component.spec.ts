import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputRepositoryCallNumbersComponent } from "./input-repository-call-numbers.component";

describe("InputRepositoryCallNumbersComponent", () => {
  let fixture: ComponentFixture<InputRepositoryCallNumbersComponent>;
  let component: InputRepositoryCallNumbersComponent;

  beforeEach(async () => {
    const renderResult = await render(InputRepositoryCallNumbersComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("appends and removes call numbers", () => {
    expect(component.value()).toEqual([]);

    component.appendCallNumber();
    expect(component.value()).toEqual([""]);

    component.removeCallNumber(0);
    expect(component.value()).toEqual([]);
  });
});
