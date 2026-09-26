import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputSourceComponent } from "./input-source.component";

describe("InputSourceComponent", () => {
  let fixture: ComponentFixture<InputSourceComponent>;
  let component: InputSourceComponent;

  const workingDatabase = signal(newGedcomDatabase());

  beforeEach(async () => {
    const renderResult = await render(InputSourceComponent, {
      bindings: [inputBinding("workingDatabase", workingDatabase)],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
