import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { ValidationComponent } from "./validation.component";

describe("ValidationComponent", () => {
  let component: ValidationComponent;
  let fixture: ComponentFixture<ValidationComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        sources: {
          S1: newGedcomSource({
            xref: "S1",
            text: "Found at https://example.com/record",
          }),
        },
      }),
    );

    const renderResult = await render(ValidationComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("lists a warning with a suggested fix for a URL found in source text", async () => {
    expect(await screen.findByText(/Create repository/)).toBeTruthy();
  });
});
