import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import {
  AncestryService,
  type AncestryDatabase,
} from "../../database/ancestry.service";
import {
  newGedcomMultimedia,
  type GedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";

@Component({
  selector: "app-input-multimedia",
  imports: [FormField],
  templateUrl: "./input-multimedia.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultimediaComponent implements FormValueControl<GedcomMultimedia> {
  readonly ancestryService = inject(AncestryService);
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly value = model<GedcomMultimedia>(newGedcomMultimedia(""));
  readonly form = form(this.value);

  async browseFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        id: "multimedia",
        startIn: this.ancestryService.gedcomResource.value()?.directoryHandle,
      });
      const file = await fileHandle.getFile();
      const relativePath = await this.ancestryService.gedcomResource
        .value()
        ?.directoryHandle?.resolve(fileHandle);

      if (!relativePath) {
        alert("File must be inside the multimedia directory");
        return;
      }

      this.value.update((m) => ({
        ...m,
        filePath: relativePath.join("/"),
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
