import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { MultimediaPreviewComponent } from "./multimedia-preview.component";

describe("MultimediaPreviewComponent", () => {
  let component: MultimediaPreviewComponent;
  let fixture: ComponentFixture<MultimediaPreviewComponent>;

  beforeEach(async () => {
    const filePath = signal("photo.jpg");
    const renderResult = await render(MultimediaPreviewComponent, {
      bindings: [inputBinding("filePath", filePath)],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
