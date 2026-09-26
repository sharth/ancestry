import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputRepositoryComponent } from "./input-repository.component";

describe("InputRepositoryComponent", () => {
  let fixture: ComponentFixture<InputRepositoryComponent>;
  let component: InputRepositoryComponent;

  beforeEach(async () => {
    const renderResult = await render(InputRepositoryComponent, {
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
