import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { IndexComponent } from "./index.component";

describe("IndexComponent", () => {
  let component: IndexComponent;
  let fixture: ComponentFixture<IndexComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const renderResult = await render(IndexComponent, {
      bindings: [inputBinding("ancestryDatabase", signal(newGedcomDatabase()))],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("matches screenshot", async () => {
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });
});
