import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { PlacesComponent } from "./places.component";

describe("PlacesComponent", () => {
  let component: PlacesComponent;
  let fixture: ComponentFixture<PlacesComponent>;

  beforeEach(async () => {
    const renderResult = await render(PlacesComponent, {
      providers: [provideRouter([])],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
