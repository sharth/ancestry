import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputSourceXrefComponent } from "./input-source-xref.component";

describe("InputSourceXrefComponent", () => {
  let fixture: ComponentFixture<InputSourceXrefComponent>;
  let component: InputSourceXrefComponent;

  beforeEach(async () => {
    const renderResult = await render(InputSourceXrefComponent, {
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
