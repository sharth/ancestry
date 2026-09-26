import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { IndividualLinkComponent } from "./individual-link.component";

describe("IndividualLinkComponent", () => {
  let component: IndividualLinkComponent;
  let fixture: ComponentFixture<IndividualLinkComponent>;

  beforeEach(async () => {
    const xref = signal("@I1@");
    const renderResult = await render(IndividualLinkComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("xref", xref)],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
