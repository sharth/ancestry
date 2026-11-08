import { Component, inject, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomMultimedia,
  type GedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import { multimediaFileName } from "../../util/multimedia-file-name";
import { MultimediaPreviewComponent } from "../multimedia/multimedia-preview.component";

@Component({
  selector: "app-input-multimedia",
  imports: [FormField, MultimediaPreviewComponent],
  templateUrl: "./input-multimedia.component.html",
  styleUrl: "./input.component.css",
})
export class InputMultimediaComponent implements FormValueControl<GedcomMultimedia> {
  readonly ancestryService = inject(AncestryService);
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomMultimedia>(newGedcomMultimedia({ xref: "" }));
  readonly form = form(this.value);

  async browseFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        id: "multimedia",
        startIn: this.ancestryService.gedcomResource.value()?.directoryHandle,
      });
      const file = await fileHandle.getFile();
      const directoryHandle =
        this.ancestryService.gedcomResource.value()?.directoryHandle;
      if (!directoryHandle) {
        alert("Multimedia files need a data folder. Open one in Settings.");
        return;
      }

      // A file already inside the data folder is linked where it is. One
      // from elsewhere is copied in, named after this record, since GEDCOM
      // paths are relative to the data folder.
      let filePath = (await directoryHandle.resolve(fileHandle))?.join("/");
      if (filePath === undefined) {
        const { xref, title } = this.value();
        const fileName = multimediaFileName(xref, title, file.name);
        if (
          !confirm(
            `"${file.name}" is outside your data folder. Copy it into the data folder as "${fileName}"?`,
          )
        ) {
          return;
        }
        filePath = await this.ancestryService.copyMultimediaFile(
          file,
          fileName,
        );
      }

      this.value.update((m) => ({
        ...m,
        filePath,
        mediaType: file.type,
      }));
    } catch (e) {
      // User cancelled or error
      if ((e as Error).name !== "AbortError") {
        console.error(e);
      }
    }
  }
}
