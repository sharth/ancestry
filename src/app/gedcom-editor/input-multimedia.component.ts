import {
  Component,
  computed,
  inject,
  input,
  model,
  resource,
  signal,
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
  // Whether a pending file's path is the default name ("<xref> <title>.ext"),
  // which follows the title as it's edited, rather than one the user chose.
  readonly useDefaultFileName = signal(true);
  // Name (and id prefix) of the Default/Custom filename radio buttons,
  // unique per record so several open editors don't share one group.
  readonly fileNameModeName = computed(
    () => `fileNameMode-${this.value().xref.replaceAll("@", "")}`,
  );
  readonly filePathProblem = resource({
    params: () =>
      this.pendingFile() ? { filePath: this.value().filePath } : undefined,
    loader: async ({ params: { filePath } }) =>
      multimediaFilePathProblem(filePath) ??
      ((await this.ancestryService.multimediaFileExists(filePath))
        ? `"${filePath}" already exists in the data folder. Choose another name.`
        : undefined),
  });

  // The title input's own handler (not an effect): while the default name
  // is in use, renaming the record renames the file it will be copied to.
  onTitleInput(event: Event) {
    const file = this.pendingFile();
    if (!file || !this.useDefaultFileName()) {
      return;
    }
    const title = (event.target as HTMLInputElement).value;
    this.form
      .filePath()
      .value.set(multimediaFileName(this.value().xref, title, file.name));
  }

  // Typing a path of their own switches to a custom name.
  onFilePathInput() {
    this.useDefaultFileName.set(false);
  }

  // Choosing the default name puts it back and forgets the edit.
  useDefaultFileNameSelected() {
    this.useDefaultFileName.set(true);
    this.form.filePath().reset(this.proposedFileName());
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
      this.useDefaultFileName.set(true);
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
