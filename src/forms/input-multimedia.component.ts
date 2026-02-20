import type { AncestryDatabase } from "../database/ancestry.service";
import { AncestryService } from "../database/ancestry.service";
import type { GedcomDate } from "../gedcom/gedcomDate";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";
import type { OnInit } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  signal,
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-multimedia",
  imports: [FormField],
  templateUrl: "./input-multimedia.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultimediaComponent implements OnInit {
  readonly ancestryService = inject(AncestryService);
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly multimedia = signal<GedcomMultimedia>({
    xref: "",
    filePath: "",
    mediaType: "",
    title: "",
  });
  readonly form = form(this.multimedia);

  readonly updateAngularDatabase = effect(() => {
    const now: GedcomDate = {
      value: new Date()
        .toLocaleString("en-gb", { dateStyle: "medium" })
        .toLocaleUpperCase(),
    };
    const multimedia = {
      ...this.multimedia(),
      changeDate: { date: now },
    };
    if (multimedia.xref !== "") {
      this.ancestryDatabase.update((ancestryDatabase) => ({
        ...ancestryDatabase,
        multimedias: {
          ...ancestryDatabase.multimedias,
          [multimedia.xref]: multimedia,
        },
      }));
    }
  });

  ngOnInit(): void {
    this.multimedia.set(
      this.ancestryDatabase().multimedias[this.xref()] ?? {
        xref: this.xref(),
        filePath: "",
        mediaType: "",
        title: "",
      },
    );
  }

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

      this.multimedia.update((m) => ({
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
