import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InputMultimediaCropComponent } from "./input-multimedia-crop.component";

describe("InputMultimediaCropComponent", () => {
  let component: InputMultimediaCropComponent;
  let fixture: ComponentFixture<InputMultimediaCropComponent>;

  beforeEach(async () => {
    const renderResult = await render(InputMultimediaCropComponent, {
      bindings: [inputBinding("blob", signal(undefined))],
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

  it("starts fitted and zooms in steps up to twice the natural size", () => {
    component.naturalSize.set({ width: 4000, height: 3000 });
    expect(component.zoomLabel()).toBe("Fit");

    component.zoom.set(1);
    component.zoomIn();
    expect(component.zoom()).toBe(1.5);
    expect(component.imageWidth()).toBe("6000px");
    component.zoomIn();
    expect(component.zoom()).toBe(2);
    expect(component.zoomLabel()).toBe("200%");
    expect(component.canZoomIn()).toBe(false);

    component.zoomOut();
    expect(component.zoom()).toBeCloseTo(4 / 3);
    expect(component.canZoomIn()).toBe(true);

    component.zoomToFit();
    expect(component.zoom()).toBeUndefined();
    expect(component.imageWidth()).toBeUndefined();
  });
});

describe("InputMultimediaCropComponent with a file", () => {
  it("shows the image to crop", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 20;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    const file = new File([blob ?? ""], "scan.png", { type: "image/png" });

    const { fixture, container } = await render(InputMultimediaCropComponent, {
      bindings: [inputBinding("blob", signal(file))],
    });

    await vi.waitFor(() => {
      expect(fixture.componentInstance.naturalSize()).toEqual({
        width: 30,
        height: 20,
      });
    });
    expect(container.textContent).not.toContain("No image available to crop");
  });
});
