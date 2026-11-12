import { DestroyRef, computed, inject, resource } from "@angular/core";
import type { ResourceRef, Signal } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import type { SafeResourceUrl } from "@angular/platform-browser";

import { AncestryService } from "../database/ancestry.service";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";

export interface MultimediaFileUrl {
  fileUrl: SafeResourceUrl;
  mediaType: string;
}

// A resource with an object URL for a multimedia record's file: its
// pendingFile if the editor picked one that hasn't been copied into the
// data folder yet, otherwise the file at its path. Call from an injection
// context (a component field). The URL is revoked when the caller is
// destroyed.
export function multimediaFileResource(
  multimedia: Signal<GedcomMultimedia>,
): ResourceRef<MultimediaFileUrl | undefined> {
  const ancestryService = inject(AncestryService);
  const sanitizer = inject(DomSanitizer);
  const destroyRef = inject(DestroyRef);
  // Separate signals, so editing other fields of the record (say, its
  // title) doesn't reload the file.
  const filePath = computed(() => multimedia().filePath);
  const pendingFile = computed(() => multimedia().pendingFile);

  return resource({
    params: () => ({
      filePath: filePath(),
      pendingFile: pendingFile(),
      gedcomResourceValue: ancestryService.gedcomResource.value(),
    }),
    loader: async ({ params }) => {
      try {
        let file = params.pendingFile;
        if (file === undefined) {
          const fileHandle = await ancestryService.getMultimediaFileHandle(
            params.filePath,
          );
          file = await fileHandle?.getFile();
        }
        if (file === undefined) {
          return undefined;
        }
        const objectUrl = URL.createObjectURL(file);
        destroyRef.onDestroy(() => {
          URL.revokeObjectURL(objectUrl);
        });
        return {
          fileUrl: sanitizer.bypassSecurityTrustResourceUrl(objectUrl),
          mediaType: file.type,
        };
      } catch (error) {
        console.error("Failed to load multimedia file:", error);
        return undefined;
      }
    },
  });
}
