import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { assert, beforeEach, describe, expect, it } from "vitest";

import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { InputFamilyChildrenComponent } from "./input-family-children.component";

describe("InputFamilyChildrenComponent", () => {
  let fixture: ComponentFixture<InputFamilyChildrenComponent>;
  let component: InputFamilyChildrenComponent;

  const workingDatabase = signal(
    newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({ xref: "@I1@" }),
        "@I2@": newGedcomIndividual({ xref: "@I2@" }),
      },
    }),
  );
  const value = signal<string[]>([]);

  beforeEach(async () => {
    value.set(["@I1@", "@I2@"]);
    const renderResult = await render(InputFamilyChildrenComponent, {
      bindings: [
        inputBinding("workingDatabase", workingDatabase),
        inputBinding("value", value),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows one row per child", () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("summary")?.textContent).toContain(
      "Children (2)",
    );
    expect(element.querySelectorAll("app-input-individual-xref")).toHaveLength(
      2,
    );
  });

  it("appends an empty child when Add child is clicked", async () => {
    const user = userEvent.setup();
    const element = fixture.nativeElement as HTMLElement;
    const addButton = element.querySelector('button[aria-label="Add child"]');
    assert.isOk(addButton);

    await user.click(addButton);
    await fixture.whenStable();

    expect(component.value()).toEqual(["@I1@", "@I2@", ""]);
    expect(element.querySelectorAll("app-input-individual-xref")).toHaveLength(
      3,
    );
  });

  it("removes the child whose Remove button is clicked", async () => {
    const user = userEvent.setup();
    const element = fixture.nativeElement as HTMLElement;
    const removeButtons = element.querySelectorAll(
      'button[aria-label="Remove child"]',
    );
    expect(removeButtons).toHaveLength(2);
    const [firstRemoveButton] = removeButtons;
    assert.isOk(firstRemoveButton);

    await user.click(firstRemoveButton);
    await fixture.whenStable();

    expect(component.value()).toEqual(["@I2@"]);
    expect(element.querySelectorAll("app-input-individual-xref")).toHaveLength(
      1,
    );
  });
});
