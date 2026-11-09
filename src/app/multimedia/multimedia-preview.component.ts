import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  resource,
  signal,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomMultimediaCrop } from "../../gedcom/gedcomMultimediaLink";

interface CropRegion {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Fills in a CROP's omitted values per GEDCOM 7: LEFT and TOP default to 0,
// WIDTH and HEIGHT default to the rest of the image. Returns undefined for a
// region that doesn't fit inside the image, which the spec calls an error, so
// the caller can show the whole image instead.
export function resolveCropRegion(
  crop: GedcomMultimediaCrop,
  naturalSize: { width: number; height: number },
): CropRegion | undefined {
  const left = crop.left ?? 0;
  const top = crop.top ?? 0;
  const width = crop.width ?? naturalSize.width - left;
  const height = crop.height ?? naturalSize.height - top;
  if (
    left < 0 ||
    top < 0 ||
    width <= 0 ||
    height <= 0 ||
    left + width > naturalSize.width ||
    top + height > naturalSize.height
  ) {
    return undefined;
  }
  return { left, top, width, height };
}

@Component({
  selector: "app-multimedia-preview",
  standalone: true,
  templateUrl: "./multimedia-preview.component.html",
  styleUrl: "./multimedia-preview.component.css",
})
export class MultimediaPreviewComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly sanitizer = inject(DomSanitizer);

  // The object URL currently handed to the template, so it can be released
  // when the file changes or the component goes away; the browser keeps the
  // file in memory until it is revoked.
  private objectUrl: string | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.revokeObjectUrl();
    });
  }

  private revokeObjectUrl() {
    if (this.objectUrl !== undefined) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }

  readonly filePath = input.required<string>();
  // The CROP of the multimedia link being shown, if any. Only applies to
  // images.
  readonly crop = input<GedcomMultimediaCrop | undefined>(undefined);

  // Only known once the browser has decoded the image; CROP is in natural
  // pixels.
  private readonly naturalSize = signal<
    { width: number; height: number } | undefined
  >(undefined);

  readonly cropRegion = computed(() => {
    const crop = this.crop();
    const naturalSize = this.naturalSize();
    if (!crop || !naturalSize) {
      return undefined;
    }
    return resolveCropRegion(crop, naturalSize);
  });

  // The container is sized to the crop region's aspect ratio, and the whole
  // image is scaled and shifted inside it so only the region shows.
  readonly cropContainerStyle = computed(() => {
    const region = this.cropRegion();
    if (!region) {
      return undefined;
    }
    return {
      "aspect-ratio": `${region.width.toString()} / ${region.height.toString()}`,
      "max-width": `${region.width.toString()}px`,
    };
  });

  readonly cropImageStyle = computed(() => {
    const region = this.cropRegion();
    const naturalSize = this.naturalSize();
    if (!region || !naturalSize) {
      return undefined;
    }
    const percent = (value: number) => `${(value * 100).toString()}%`;
    return {
      left: percent(-region.left / region.width),
      top: percent(-region.top / region.height),
      width: percent(naturalSize.width / region.width),
      height: percent(naturalSize.height / region.height),
    };
  });

  // Until the image has loaded, the crop can't be applied yet, so a cropped
  // preview stays hidden rather than flashing the whole image.
  readonly hideUntilLoaded = computed(
    () => this.crop() !== undefined && this.naturalSize() === undefined,
  );

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this.naturalSize.set({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  }

  readonly fileResource = resource({
    params: () => {
      const filePath = this.filePath();
      if (!filePath) {
        return null;
      }
      return {
        filePath,
        gedcomResourceValue: this.ancestryService.gedcomResource.value(),
      };
    },
    loader: async ({ params }) => {
      this.revokeObjectUrl();
      if (!params) {
        return { fileUrl: undefined, mediaType: undefined };
      }

      try {
        const fileHandle = await this.ancestryService.getMultimediaFileHandle(
          params.filePath,
        );
        if (!fileHandle) {
          return { fileUrl: undefined, mediaType: undefined };
        }

        const file = await fileHandle.getFile();
        this.objectUrl = URL.createObjectURL(file);
        const fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.objectUrl,
        );
        return { fileUrl, mediaType: file.type };
      } catch (error) {
        console.error("Failed to load multimedia file:", error);
        return { fileUrl: undefined, mediaType: undefined };
      }
    },
  });
}
