import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GedcomEditorDialogComponent } from "./gedcom-editor-dialog.component";

describe("GedcomEditorDialogComponent", () => {
  let component: GedcomEditorDialogComponent;
  let fixture: ComponentFixture<GedcomEditorDialogComponent>;

  beforeEach(async () => {
    const type = signal<"INDI" | "SOUR" | "OBJE" | "REPO">("INDI");
    const ancestryDatabase = signal(newGedcomDatabase());

    const renderResult = await render(GedcomEditorDialogComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding("type", type),
        inputBinding("ancestryDatabase", ancestryDatabase),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
