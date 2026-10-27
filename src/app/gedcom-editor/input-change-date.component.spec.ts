import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "../../gedcom/gedcomChangeDate";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputChangeDateComponent } from "./input-change-date.component";

describe("InputChangeDateComponent", () => {
  let fixture: ComponentFixture<InputChangeDateComponent>;
  let component: InputChangeDateComponent;

  beforeEach(async () => {
    const renderResult = await render(InputChangeDateComponent, {
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

// Regression test for the bug Bill reported directly: opening the
// individual editor on an existing person with no edits still showed the
// unsaved-changes warning. Root cause: this component used to carry an
// `effect()` that unconditionally rewrote its bound CHAN value to today's
// date as soon as it was created. Signal Forms treats a FormValueControl's
// own emitted value (even one emitted from an effect, not a real DOM
// event) as a genuine, dirtying change -- see
// GedcomEditorComponent.hasUnsavedChanges() -- so any individual or
// source whose stored CHAN date wasn't already stamped to today reported
// unsaved changes the instant its editor was opened, before the user
// touched anything. The existing "should create" test above didn't catch
// this because it never inspected `value()` afterwards. This is a
// separate top-level suite, rather than reusing the beforeEach above, so
// the "value" binding can be supplied up front, the way `bindings`
// requires.
describe("InputChangeDateComponent with an existing CHAN date", () => {
  it("leaves the value untouched rather than stamping it to today", async () => {
    const existingValue = newGedcomChangeDate({ value: "5 AUG 2020" });
    const renderResult = await render(InputChangeDateComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(newGedcomDatabase())),
        inputBinding("value", signal(existingValue)),
      ],
      waitForStableOnRender: true,
    });

    expect(renderResult.fixture.componentInstance.value()).toEqual(
      existingValue,
    );
  });
});
