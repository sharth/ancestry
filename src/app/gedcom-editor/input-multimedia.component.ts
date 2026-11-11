import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  resource,
  signal,
  untracked,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomMultimedia,
  type GedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import {
  multimediaFileName,
  multimediaFilePathProblem,
} from "../../util/multimedia-file-name";
import { MultimediaPreviewComponent } from "../multimedia/multimedia-preview.component";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";

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

  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  // A file picked from outside the data folder. The editor copies it to
  // this record's file path on submit.
  readonly pendingFile = computed(() =>
    this.gedcomEditor?.pendingMultimediaFile(this.value().xref),
  );
  readonly proposedFileName = computed(() => {
    const file = this.pendingFile();
    const { xref, title } = this.value();
    return file ? multimediaFileName(xref, title, file.name) : "";
  });
  // Until the user types their own file path, it follows the proposed name
  // (and so the title, as it's edited).
  readonly followProposedFileName = signal(false);
  readonly filePathProblem = resource({
    params: () =>
      this.pendingFile() ? { filePath: this.value().filePath } : undefined,
    loader: async ({ params: { filePath } }) =>
      multimediaFilePathProblem(filePath) ??
      ((await this.ancestryService.multimediaFileExists(filePath))
        ? `"${filePath}" already exists in the data folder. Choose another name.`
        : undefined),
  });

  constructor() {
    effect(() => {
      const proposedFileName = this.proposedFileName();
      if (
        this.followProposedFileName() &&
        proposedFileName &&
        untracked(this.value).filePath !== proposedFileName
      ) {
        this.value.update((m) => ({ ...m, filePath: proposedFileName }));
      }
    });
  }

  async browseFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        id: "multimedia",
        startIn: this.ancestryService.gedcomResource.value()?.directoryHandle,
      });
      const file = await fileHandle.getFile();
      const directoryHandle =
        this.ancestryService.gedcomResource.value()?.directoryHandle;
      if (!directoryHandle || !this.gedcomEditor) {
        alert("Multimedia files need a data folder. Open one in Settings.");
        return;
      }

      // A file already inside the data folder is linked where it is. One
      // from elsewhere is copied in on submit, since GEDCOM paths are
      // relative to the data folder.
      const relativePath = await directoryHandle.resolve(fileHandle);
      const xref = this.value().xref;
      this.gedcomEditor.setPendingMultimediaFile(
        xref,
        relativePath ? undefined : file,
      );
      this.followProposedFileName.set(!relativePath);
      this.value.update((m) => ({
        ...m,
        filePath: relativePath
          ? relativePath.join("/")
          : multimediaFileName(xref, m.title, file.name),
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
