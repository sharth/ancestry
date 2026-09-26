import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { page } from "vitest/browser";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { IndexComponent } from "./index.component";

describe("IndexComponent", () => {
  let component: IndexComponent;
  let fixture: ComponentFixture<IndexComponent>;

  beforeEach(async () => {
    const ancestryDatabase = signal(newGedcomDatabase());

    const renderResult = await render(IndexComponent, {
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("matches screenshot", async () => {
    const element = fixture.nativeElement as HTMLElement;
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });
});
