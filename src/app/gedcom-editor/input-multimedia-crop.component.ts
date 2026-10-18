import {
  Component,
  computed,
  inject,
  input,
  model,
  resource,
  signal,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomMultimediaCrop } from "../../gedcom/gedcomMultimediaLink";

interface DragStart {
  xPercent: number;
  yPercent: number;
}

@Component({
  selector: "app-input-multimedia-crop",
  templateUrl: "./input-multimedia-crop.component.html",
  styleUrl: "./input-multimedia-crop.component.css",
})
export class InputMultimediaCropComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly filePath = input.required<string>();
  readonly value = model<GedcomMultimediaCrop | undefined>(undefined);

  // Only known once the browser has decoded the image; a crop is stored in
  // these natural pixel dimensions so it stays correct regardless of how
  // large the preview is rendered.
  private readonly naturalSize = signal<
    { width: number; height: number } | undefined
  >(undefined);
  private dragStart: DragStart | undefined;

  readonly fileResource = resource({
    params: () => ({
      filePath: this.filePath(),
      gedcomResourceValue: this.ancestryService.gedcomResource.value(),
    }),
    loader: async ({ params }) => {
      const fileHandle = await this.ancestryService.getMultimediaFileHandle(
        params.filePath,
      );
      if (!fileHandle) {
        return undefined;
      }
      const file = await fileHandle.getFile();
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        URL.createObjectURL(file),
      );
    },
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

  startDrag(event: PointerEvent) {
    const { xPercent, yPercent } = this.pointerPercent(event);
    this.dragStart = { xPercent, yPercent };
    this.applyDrag(xPercent, yPercent);
  }

  continueDrag(event: PointerEvent) {
    if (!this.dragStart) {
      return;
    }
    const { xPercent, yPercent } = this.pointerPercent(event);
    this.applyDrag(xPercent, yPercent);
  }

  endDrag() {
    this.dragStart = undefined;
    const crop = this.value();
    if (crop && (!crop.width || !crop.height)) {
      this.value.set(undefined);
    }
  }

  clearCrop() {
    this.value.set(undefined);
  }

  private pointerPercent(event: PointerEvent): {
    xPercent: number;
    yPercent: number;
  } {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
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
