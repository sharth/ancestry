import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { GedcomDiffComponent } from "./gedcom-diff.component";

describe("GedcomDiffComponent", () => {
  let component: GedcomDiffComponent;
  let fixture: ComponentFixture<GedcomDiffComponent>;

  beforeEach(async () => {
    const newGedcomRecord = signal(undefined);
    const oldGedcomRecord = signal(undefined);

    const renderResult = await render(GedcomDiffComponent, {
      bindings: [
        inputBinding("newGedcomRecord", newGedcomRecord),
        inputBinding("oldGedcomRecord", oldGedcomRecord),
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
