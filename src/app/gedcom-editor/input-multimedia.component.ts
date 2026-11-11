import {
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import {
  AncestryService,
  MultimediaFileExistsError,
} from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomMultimedia,
  type GedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import {
  multimediaFileName,
  sanitizeFileName,
} from "../../util/multimedia-file-name";
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

  // A file picked from outside the data folder, waiting to be copied in.
  readonly pendingFile = signal<File | undefined>(undefined);
  // What the user typed for the copy's name; empty means use the proposed
  // name, which follows the record's xref and title as they're edited.
  readonly copyFileName = signal("");
  readonly proposedFileName = computed(() => {
    const file = this.pendingFile();
    const { xref, title } = this.value();
    return file ? multimediaFileName(xref, title, file.name) : "";
  });
  readonly copyError = signal("");

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

      this.cancelCopy();
      // A file already inside the data folder is linked where it is. One
      // from elsewhere has to be copied in first (see copyFile), since
      // GEDCOM paths are relative to the data folder.
      const relativePath = await directoryHandle.resolve(fileHandle);
      if (relativePath) {
        this.value.update((m) => ({
          ...m,
          filePath: relativePath.join("/"),
          mediaType: file.type,
        }));
      } else {
        this.pendingFile.set(file);
      }
    } catch (e) {
      // User cancelled or error
      if ((e as Error).name !== "AbortError") {
        console.error(e);
      }
    }
  }

  async copyFile() {
    const file = this.pendingFile();
    if (!file) {
      return;
    }
    const fileName =
      sanitizeFileName(this.copyFileName()) || this.proposedFileName();
    try {
      await this.ancestryService.copyMultimediaFile(file, fileName);
    } catch (e) {
      this.copyError.set(
        e instanceof MultimediaFileExistsError
          ? `"${fileName}" already exists in the data folder. Choose another name.`
          : `Couldn't copy the file: ${(e as Error).message}`,
      );
      return;
    }
    this.value.update((m) => ({
      ...m,
      filePath: fileName,
      mediaType: file.type,
    }));
    this.cancelCopy();
  }

  onCopyFileNameInput(event: Event) {
    this.copyFileName.set((event.target as HTMLInputElement).value);
    this.copyError.set("");
  }

  cancelCopy() {
    this.pendingFile.set(undefined);
    this.copyFileName.set("");
    this.copyError.set("");
  }
}
