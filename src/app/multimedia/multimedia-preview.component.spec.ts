import { inputBinding, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import {
  MultimediaPreviewComponent,
  resolveCropRegion,
} from "./multimedia-preview.component";

describe("MultimediaPreviewComponent", () => {
  let component: MultimediaPreviewComponent;
  let fixture: ComponentFixture<MultimediaPreviewComponent>;

  beforeEach(async () => {
    const renderResult = await render(MultimediaPreviewComponent, {
      bindings: [inputBinding("filePath", signal("photo.jpg"))],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

describe("resolveCropRegion", () => {
  const naturalSize = { width: 100, height: 50 };

  it("uses an explicit region as is", () => {
    expect(
      resolveCropRegion(
        { left: 10, top: 5, width: 40, height: 20 },
        naturalSize,
      ),
    ).toEqual({ left: 10, top: 5, width: 40, height: 20 });
  });

  it("fills in omitted values from the image size", () => {
    expect(resolveCropRegion({ left: 10, top: 5 }, naturalSize)).toEqual({
      left: 10,
      top: 5,
      width: 90,
      height: 45,
    });
  });

  it("rejects a region outside the image", () => {
    expect(
      resolveCropRegion({ left: 80, width: 40 }, naturalSize),
    ).toBeUndefined();
  });
});

describe("MultimediaPreviewComponent with a crop", () => {
  async function pngFile(width: number, height: number): Promise<File> {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    if (!blob) throw new Error("canvas.toBlob failed");
    return new File([blob], "photo.png", { type: "image/png" });
  }

  it("shows only the cropped region of the image", async () => {
    const file = await pngFile(100, 50);
    const { fixture } = await render(MultimediaPreviewComponent, {
      bindings: [
        inputBinding("filePath", signal("photo.png")),
        inputBinding(
          "crop",
          signal({ left: 10, top: 5, width: 40, height: 20 }),
        ),
      ],
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: { value: () => undefined },
            getMultimediaFileHandle: () =>
              Promise.resolve({ getFile: () => Promise.resolve(file) }),
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
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(img.style.width).toBe("250%");
    });

    const container = img.parentElement;
    expect(container?.classList).toContain("crop-container");
    expect(container?.style.aspectRatio).toBe("40 / 20");
    expect(container?.style.maxWidth).toBe("40px");
    expect(img.style.left).toBe("-25%");
    expect(img.style.top).toBe("-25%");
    expect(img.style.height).toBe("250%");
    expect(img.classList).not.toContain("invisible");
  });

  it("revokes the file's object URL when destroyed", async () => {
    const file = await pngFile(10, 10);
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const { fixture } = await render(MultimediaPreviewComponent, {
      bindings: [inputBinding("filePath", signal("photo.png"))],
      providers: [
        {
          provide: AncestryService,
          useValue: {
            gedcomResource: { value: () => undefined },
            getMultimediaFileHandle: () =>
              Promise.resolve({ getFile: () => Promise.resolve(file) }),
          },
        },
      ],
      waitForStableOnRender: true,
    });
    const img = await vi.waitFor(() => {
      const img = (fixture.nativeElement as HTMLElement).querySelector("img");
      if (!img) throw new Error("image not rendered yet");
      return img;
    });
    expect(img.src).toMatch(/^blob:/);
    expect(revoke).not.toHaveBeenCalled();

    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith(img.src);
  });
});
