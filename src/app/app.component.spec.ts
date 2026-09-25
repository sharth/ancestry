import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AncestryService } from "../database/ancestry.service";
import { AppComponent } from "./app.component";

describe("AppComponent", () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

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
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
