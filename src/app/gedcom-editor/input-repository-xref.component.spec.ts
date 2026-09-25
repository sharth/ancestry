import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";

describe("InputRepositoryXrefComponent", () => {
  let fixture: ComponentFixture<InputRepositoryXrefComponent>;
  let component: InputRepositoryXrefComponent;

  const workingDatabase = signal(
    newGedcomDatabase({
      repositories: {
        R1: { xref: "R1", name: "Mock Repository 1" },
      },
    }),
  );
  const value = signal("R1");

  beforeEach(async () => {
    const renderResult = await render(InputRepositoryXrefComponent, {
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

  it("should focus the select element when focus() is called", async () => {
    const element = fixture.nativeElement as HTMLElement;
    const select = element.querySelector<HTMLSelectElement>("select#xref");
    assert.isOk(select);

    component.focus();
    await fixture.whenStable();

    expect(document.activeElement).toBe(select);
  });
});
