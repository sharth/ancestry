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

  it("hasUnsavedChanges delegates to the edit dialog", () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it("lists a warning with a button to review the suggested fix", async () => {
    expect(await screen.findByText(/Create repository/)).toBeTruthy();
  });

  it("shows the before and proposed-after GEDCOM for the suggestion", async () => {
    await screen.findByText(/Create repository/);
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain("1 TEXT Found at https://example.com/record");
    expect(text).toContain("1 REPO @R0@");
    expect(text).toContain("0 @R0@ REPO");
  });
});
