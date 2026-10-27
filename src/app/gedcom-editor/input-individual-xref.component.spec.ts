import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

describe("InputIndividualXrefComponent", () => {
  let fixture: ComponentFixture<InputIndividualXrefComponent>;
  let component: InputIndividualXrefComponent;

  beforeEach(async () => {
    const renderResult = await render(InputIndividualXrefComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("disables the New button without an editor", () => {
    expect(screen.getByRole("button", { name: /New/ })).toHaveProperty(
      "disabled",
      true,
    );
  });
});

describe("InputIndividualXrefComponent with an editor", () => {
  it("creates a new individual and selects it", async () => {
    const openNewIndividual = vi.fn().mockReturnValue("@I7@");
    const { fixture } = await render(InputIndividualXrefComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      providers: [{ provide: GEDCOM_EDITOR, useValue: { openNewIndividual } }],
      waitForStableOnRender: true,
    });

    screen.getByRole("button", { name: /New/ }).click();

    expect(openNewIndividual).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.value()).toBe("@I7@");
  });
});
