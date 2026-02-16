import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from "@angular/core";
import type { ResourceRef } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-multimedia",
  imports: [RouterModule, GedcomEditorDialogComponent],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultimediaComponent {
  readonly ancestryService = inject(AncestryService);
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const multimedia = ancestryDatabase.multimedias[this.xref()];
    if (multimedia === undefined) {
      return undefined;
    }

    return { multimedia };
  });

  readonly fileResource = resource({
    params: () => {
      const vm = this.vm();
      if (!vm?.multimedia.filePath) {
        return null;
      }
      return {
        filePath: vm.multimedia.filePath,
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
        for (let i = 0; i < pathParts.length - 1; i++) {
          directoryHandle = await directoryHandle.getDirectoryHandle(
            pathParts[i]!,
          );
        }

        // Get the file from the final directory
        const fileName = pathParts[pathParts.length - 1]!;
        const fileHandle = await directoryHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const fileUrl = URL.createObjectURL(file);
        return { fileUrl, mediaType: file.type };
      } catch (error) {
        console.error("Failed to load multimedia file:", error);
        return { fileUrl: undefined, mediaType: undefined };
      }
    },
  });
}
