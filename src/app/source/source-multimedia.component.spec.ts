import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { SourceMultimediaComponent } from "./source-multimedia.component";

describe("SourceMultimediaComponent", () => {
  let component: SourceMultimediaComponent;
  let fixture: ComponentFixture<SourceMultimediaComponent>;

  beforeEach(async () => {
    const renderResult = await render(SourceMultimediaComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("xref", signal("@S1@"))],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
