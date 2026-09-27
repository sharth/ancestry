import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { InputMultimediaCropComponent } from "./input-multimedia-crop.component";

describe("InputMultimediaCropComponent", () => {
  let component: InputMultimediaCropComponent;
  let fixture: ComponentFixture<InputMultimediaCropComponent>;

  beforeEach(async () => {
    const renderResult = await render(InputMultimediaCropComponent, {
      bindings: [inputBinding("filePath", signal("photo.jpg"))],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("clearCrop clears the value", () => {
    component.value.set({ top: 1, left: 2, height: 3, width: 4 });
    component.clearCrop();
    expect(component.value()).toBeUndefined();
  });
});
