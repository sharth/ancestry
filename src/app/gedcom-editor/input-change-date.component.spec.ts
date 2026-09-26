import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputChangeDateComponent } from "./input-change-date.component";

describe("InputChangeDateComponent", () => {
  let fixture: ComponentFixture<InputChangeDateComponent>;
  let component: InputChangeDateComponent;

  const workingDatabase = signal(newGedcomDatabase());

  beforeEach(async () => {
    const renderResult = await render(InputChangeDateComponent, {
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
