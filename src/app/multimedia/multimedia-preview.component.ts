import { AncestryService } from "../../database/ancestry.service";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  resource,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-multimedia-preview",
  standalone: true,
  templateUrl: "./multimedia-preview.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        changeCount: this.ancestryService.ancestryChanges(),
      };
    },
    loader: async ({ params }) => {
      if (!params) {
        return { fileUrl: undefined, mediaType: undefined };
      }

      const gedcomResourceValue = this.ancestryService.gedcomResource.value();
      let directoryHandle = gedcomResourceValue?.directoryHandle;

      if (!directoryHandle) {
        return { fileUrl: undefined, mediaType: undefined };
      }

      try {
        // Split the path by both forward and backward slashes
        const pathParts = params.filePath
          .split(/[/\\]/)
          .filter((part) => part.length > 0);

        if (pathParts.length === 0) {
          throw new Error("Invalid file path");
        }

        // Navigate through subdirectories
        for (const part of pathParts.slice(0, -1)) {
          directoryHandle = await directoryHandle.getDirectoryHandle(part);
        }

        // Get the file from the final directory
        const fileName = pathParts[pathParts.length - 1];
        if (!fileName) {
          throw new Error("Invalid file path");
        }
        const fileHandle = await directoryHandle.getFileHandle(fileName);
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
