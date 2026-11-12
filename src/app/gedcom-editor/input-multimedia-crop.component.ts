import type { ElementRef } from "@angular/core";
import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from "@angular/core";

import type { GedcomMultimediaCrop } from "../../gedcom/gedcomMultimediaLink";
import { fileObjectUrl } from "../../util/object-url";

interface DragStart {
  xPercent: number;
  yPercent: number;
}

// Each zoom step multiplies or divides the scale by this much.
const zoomStep = 1.5;
// The largest zoom offered, as a multiple of the image's natural size.
const maxZoom = 2;
// While dragging, getting this close (in CSS pixels) to an edge of the
// scrollable viewport scrolls it, so a crop can extend past what's visible.
const autoScrollMargin = 32;

@Component({
  selector: "app-input-multimedia-crop",
  templateUrl: "./input-multimedia-crop.component.html",
  styleUrl: "./input-multimedia-crop.component.css",
})
export class InputMultimediaCropComponent {
  private readonly injector = inject(Injector);

  // The image to crop, already read by whoever knows where it lives (the
  // data folder, or a file picked in the editor but not yet copied in).
  readonly file = input.required<File | undefined>();
  readonly value = model<GedcomMultimediaCrop | undefined>(undefined);

  private readonly viewport =
    viewChild<ElementRef<HTMLElement>>("cropViewport");
  private readonly container =
    viewChild<ElementRef<HTMLElement>>("cropContainer");
  private readonly image = viewChild<ElementRef<HTMLImageElement>>("cropImage");

  // Only known once the browser has decoded the image; a crop is stored in
  // these natural pixel dimensions so it stays correct regardless of how
  // large the preview is rendered.
  readonly naturalSize = signal<{ width: number; height: number } | undefined>(
    undefined,
  );
  // The rendered size as a fraction of the natural size, or undefined to fit
  // the whole image in the viewport.
  readonly zoom = signal<number | undefined>(undefined);
  private dragStart: DragStart | undefined;

  readonly fileUrl = fileObjectUrl(this.file);

  readonly imageWidth = computed(() => {
    const zoom = this.zoom();
    const naturalSize = this.naturalSize();
    if (zoom === undefined || !naturalSize) {
      return undefined;
    }
    return `${(naturalSize.width * zoom).toString()}px`;
  });

  readonly zoomLabel = computed(() => {
    const zoom = this.zoom();
    return zoom === undefined ? "Fit" : `${Math.round(zoom * 100).toString()}%`;
  });

  readonly canZoomIn = computed(() => {
    const zoom = this.zoom();
    return !!this.naturalSize() && (zoom === undefined || zoom < maxZoom);
  });

  readonly cropStyle = computed(() => {
    const crop = this.value();
    const naturalSize = this.naturalSize();
    if (
      !crop ||
      !naturalSize ||
      naturalSize.width === 0 ||
      naturalSize.height === 0
    ) {
      return undefined;
    }
    const { top = 0, left = 0, width = 0, height = 0 } = crop;
    return {
      left: `${((left / naturalSize.width) * 100).toString()}%`,
      top: `${((top / naturalSize.height) * 100).toString()}%`,
      width: `${((width / naturalSize.width) * 100).toString()}%`,
      height: `${((height / naturalSize.height) * 100).toString()}%`,
    };
  });

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.naturalSize.set({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  }

  zoomIn() {
    const scale = this.currentScale();
    if (scale === undefined) {
      return;
    }
    this.setZoom(Math.min(scale * zoomStep, maxZoom));
  }

  zoomOut() {
    const scale = this.currentScale();
    if (scale === undefined) {
      return;
    }
    const zoom = scale / zoomStep;
    // Once zooming out would make the image smaller than the fitted view,
    // just fit it.
    this.setZoom(zoom <= (this.fitScale() ?? 0) ? undefined : zoom);
  }

  zoomToFit() {
    this.setZoom(undefined);
  }

  startDrag(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const { xPercent, yPercent } = this.pointerPercent(event);
    this.dragStart = { xPercent, yPercent };
    this.applyDrag(xPercent, yPercent);
  }

  continueDrag(event: PointerEvent) {
    if (!this.dragStart) {
      return;
    }
    this.autoScroll(event);
    const { xPercent, yPercent } = this.pointerPercent(event);
    this.applyDrag(xPercent, yPercent);
  }

  endDrag() {
    if (!this.dragStart) {
      return;
    }
    this.dragStart = undefined;
    const crop = this.value();
    if (crop && (!crop.width || !crop.height)) {
      this.value.set(undefined);
    }
  }

  clearCrop() {
    this.value.set(undefined);
  }

  // The scale the image is rendered at right now, whether zoomed or fitted.
  private currentScale(): number | undefined {
    return this.zoom() ?? this.fitScale();
  }

  private fitScale(): number | undefined {
    const naturalSize = this.naturalSize();
    const img = this.image()?.nativeElement;
    if (!naturalSize || !img || naturalSize.width === 0) {
      return undefined;
    }
    return img.clientWidth / naturalSize.width;
  }

  // Changes the zoom while keeping the crop (or, without one, whatever was in
  // the middle of the viewport) centered.
  private setZoom(zoom: number | undefined) {
    const viewport = this.viewport()?.nativeElement;
    const naturalSize = this.naturalSize();
    let center = { x: 0.5, y: 0.5 };
    const crop = this.value();
    if (crop && naturalSize) {
      const { top = 0, left = 0, width = 0, height = 0 } = crop;
      center = {
        x: (left + width / 2) / naturalSize.width,
        y: (top + height / 2) / naturalSize.height,
      };
    } else if (viewport) {
      center = {
        x:
          (viewport.scrollLeft + viewport.clientWidth / 2) /
          viewport.scrollWidth,
        y:
          (viewport.scrollTop + viewport.clientHeight / 2) /
          viewport.scrollHeight,
      };
    }
    this.zoom.set(zoom);
    afterNextRender(
      () => {
        const viewport = this.viewport()?.nativeElement;
        if (!viewport) {
          return;
        }
        viewport.scrollIntoView({ block: "nearest" });
        viewport.scrollLeft =
          center.x * viewport.scrollWidth - viewport.clientWidth / 2;
        viewport.scrollTop =
          center.y * viewport.scrollHeight - viewport.clientHeight / 2;
      },
      { injector: this.injector },
    );
  }

  private autoScroll(event: PointerEvent) {
    const viewport = this.viewport()?.nativeElement;
    if (!viewport) {
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const scrollSpeed = (distance: number) =>
      Math.max(0, autoScrollMargin - distance) / 2;
    viewport.scrollBy(
      scrollSpeed(rect.right - event.clientX) -
        scrollSpeed(event.clientX - rect.left),
      scrollSpeed(rect.bottom - event.clientY) -
        scrollSpeed(event.clientY - rect.top),
    );
  }

  private pointerPercent(event: PointerEvent): {
    xPercent: number;
    yPercent: number;
  } {
    const container =
      this.container()?.nativeElement ?? (event.currentTarget as HTMLElement);
    const rect = container.getBoundingClientRect();
    return {
      xPercent: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      yPercent: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  private applyDrag(xPercent: number, yPercent: number) {
    const dragStart = this.dragStart;
    const naturalSize = this.naturalSize();
    if (!dragStart || !naturalSize) {
      return;
    }
    const leftPercent = Math.min(dragStart.xPercent, xPercent);
    const topPercent = Math.min(dragStart.yPercent, yPercent);
    const widthPercent = Math.abs(xPercent - dragStart.xPercent);
    const heightPercent = Math.abs(yPercent - dragStart.yPercent);

    this.value.set({
      left: Math.round((leftPercent / 100) * naturalSize.width),
      top: Math.round((topPercent / 100) * naturalSize.height),
      width: Math.round((widthPercent / 100) * naturalSize.width),
      height: Math.round((heightPercent / 100) * naturalSize.height),
    });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
