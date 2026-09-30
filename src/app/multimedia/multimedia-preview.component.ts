import { Component, inject, input, resource } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-multimedia-preview",
  standalone: true,
  templateUrl: "./multimedia-preview.component.html",
})
export class MultimediaPreviewComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly filePath = input.required<string>();

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
        const fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          URL.createObjectURL(file),
        );
        return { fileUrl, mediaType: file.type };
      } catch (error) {
        console.error("Failed to load multimedia file:", error);
        return { fileUrl: undefined, mediaType: undefined };
      }
    },
  });
}
