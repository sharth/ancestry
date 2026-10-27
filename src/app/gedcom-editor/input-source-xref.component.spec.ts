import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
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

  it("disables the New button without an editor", () => {
    expect(screen.getByRole("button", { name: /New/ })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("disables the Edit button without an editor", () => {
    expect(screen.getByRole("button", { name: /Edit/ })).toHaveProperty(
      "disabled",
      true,
    );
  });
});

describe("InputSourceXrefComponent with an editor", () => {
  it("creates a new source and selects it", async () => {
    const openNewSource = vi.fn().mockReturnValue("@S7@");
    const { fixture } = await render(InputSourceXrefComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      providers: [{ provide: GEDCOM_EDITOR, useValue: { openNewSource } }],
      waitForStableOnRender: true,
    });

    screen.getByRole("button", { name: /New/ }).click();

    expect(openNewSource).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.value()).toBe("@S7@");
  });

  it("opens the selected source", async () => {
    const openSource = vi.fn();
    await render(InputSourceXrefComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(newGedcomDatabase())),
        inputBinding("value", signal("@S3@")),
      ],
      providers: [{ provide: GEDCOM_EDITOR, useValue: { openSource } }],
      waitForStableOnRender: true,
    });

    screen.getByRole("button", { name: /Edit/ }).click();

    expect(openSource).toHaveBeenCalledWith("@S3@");
  });

  it("disables Edit until a source is selected", async () => {
    await render(InputSourceXrefComponent, {
      bindings: [inputBinding("workingDatabase", signal(newGedcomDatabase()))],
      providers: [{ provide: GEDCOM_EDITOR, useValue: {} }],
      waitForStableOnRender: true,
    });

    expect(screen.getByRole("button", { name: /Edit/ })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
