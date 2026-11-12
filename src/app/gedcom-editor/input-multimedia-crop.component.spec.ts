import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { InputMultimediaCropComponent } from "./input-multimedia-crop.component";

describe("InputMultimediaCropComponent", () => {
  let component: InputMultimediaCropComponent;
  let fixture: ComponentFixture<InputMultimediaCropComponent>;

  beforeEach(async () => {
    const renderResult = await render(InputMultimediaCropComponent, {
      bindings: [
        inputBinding(
          "multimedia",
          signal(newGedcomMultimedia({ xref: "@M1@", filePath: "photo.jpg" })),
        ),
      ],
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

describe("InputMultimediaCropComponent with a pending file", () => {
  it("crops the pending file without reading the data folder", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 10;
    canvas.height = 10;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    if (!blob) throw new Error("canvas.toBlob failed");
    const file = new File([blob], "photo.png", { type: "image/png" });
    const getFileHandle = vi.fn();
    const { fixture } = await render(InputMultimediaCropComponent, {
      bindings: [
        inputBinding(
          "multimedia",
          signal(
            newGedcomMultimedia({
              xref: "@M1@",
              filePath: "not-copied-yet.png",
              pendingFile: file,
            }),
          ),
        ),
      ],
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: {
              value: () => ({ directoryHandle: { getFileHandle } }),
            },
          },
        },
      ],
      waitForStableOnRender: true,
    });

    const img = await vi.waitFor(() => {
      const img = (fixture.nativeElement as HTMLElement).querySelector("img");
      if (!img?.complete || img.naturalWidth === 0) {
        throw new Error("image not loaded yet");
      }
      return img;
    });
    expect(img.naturalWidth).toBe(10);
    expect(getFileHandle).not.toHaveBeenCalled();
  });
});
