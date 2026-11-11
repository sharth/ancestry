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
  host: {
    // The data folder can change outside the app (say, in a file manager),
    // so check the copy's path again whenever the user comes back.
    "(window:focus)": "filePathProblem.reload()",
  },
})
export class InputMultimediaComponent implements FormValueControl<GedcomMultimedia> {
  readonly ancestryService = inject(AncestryService);
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomMultimedia>(newGedcomMultimedia({ xref: "" }));
  readonly form = form(this.value);

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
  // The file last picked with Browse..., shown read-only: its path if it's
  // inside the data folder, otherwise just its name (the browser doesn't
  // reveal where else it lives).
  readonly sourceFileName = signal("");
  // What the user typed as the path to copy a pending file to. Empty means
  // the proposed name (shown as the field's placeholder), which follows the
  // title as it's edited; clearing the field goes back to it.
  readonly copyFileName = signal("");
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
    // While a file is pending, the record's file path is whatever the copy
    // will be saved as, so the GEDCOM delta shows it.
    effect(() => {
      if (!this.pendingFile()) {
        return;
      }
      const filePath = this.copyFileName().trim() || this.proposedFileName();
      if (untracked(this.value).filePath !== filePath) {
        this.value.update((m) => ({ ...m, filePath }));
      }
    });
  }

  onCopyFileNameInput(event: Event) {
    this.copyFileName.set((event.target as HTMLInputElement).value);
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
      this.copyFileName.set("");
      this.sourceFileName.set(relativePath?.join("/") ?? file.name);
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
