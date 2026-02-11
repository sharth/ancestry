import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";
import type { OnInit } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  effect,
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
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly multimedia = signal<GedcomMultimedia>({
    xref: "",
    filePath: "",
    mediaType: "",
  });
  readonly form = form(this.multimedia);

  readonly updateAngularDatabase = effect(() => {
    const multimedia = this.multimedia();
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
      },
    );
  }
}
