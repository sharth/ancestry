import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { AncestryService } from "../database/ancestry.service";
import { AppComponent } from "./app.component";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    const spy = {
      requestPermissions: vi.fn(),
      clearDatabase: vi.fn(),
    };

    const renderResult = await render(AppComponent, {
      providers: [
        { provide: AncestryService, useValue: spy },
        provideRouter([]),
      ],
      waitForStableOnRender: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("matches screenshot on desktop", async () => {
    await page.viewport(1280, 900);
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });

  it("matches screenshot on mobile with the nav closed", async () => {
    await page.viewport(390, 844);
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });

  it("matches screenshot on mobile with the nav open", async () => {
    await page.viewport(390, 844);
    component.toggleSidebar();
    await fixture.whenStable();
    await expect(page.elementLocator(element)).toMatchScreenshot();
  });
});
