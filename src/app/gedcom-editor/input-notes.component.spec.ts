import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputNotesComponent } from "./input-notes.component";

describe("InputNotesComponent", () => {
  let fixture: ComponentFixture<InputNotesComponent>;
  let component: InputNotesComponent;
  const collapseWhenEmpty = signal(true);

  beforeEach(async () => {
    collapseWhenEmpty.set(true);
    const renderResult = await render(InputNotesComponent, {
      bindings: [
        inputBinding("workingDatabase", signal(newGedcomDatabase())),
        inputBinding("collapseWhenEmpty", collapseWhenEmpty),
      ],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows only an add button while there are no notes", () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("details")).toBeNull();
    expect(element.classList).toContain("empty-list");
    expect(screen.getByRole("button", { name: "Add note" })).toBeTruthy();
  });

  it("shows the Notes section once a note is added", async () => {
    await userEvent.click(screen.getByRole("button", { name: "Add note" }));
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("summary")?.textContent).toContain(
      "Notes (1)",
    );
    expect(element.classList).not.toContain("empty-list");
  });

  it("keeps the whole Notes section when collapseWhenEmpty is false", async () => {
    collapseWhenEmpty.set(false);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("summary")?.textContent).toContain(
      "Notes (0)",
    );
    expect(element.classList).not.toContain("empty-list");
  });
});
