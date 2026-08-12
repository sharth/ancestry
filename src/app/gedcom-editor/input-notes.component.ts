import {
  ChangeDetectionStrategy,
  Component,
  ViewChildren,
  afterNextRender,
  input,
  model,
  type ElementRef,
  type QueryList,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { newGedcomNote, type GedcomNote } from "../../gedcom/gedcomNote";

@Component({
  selector: "app-input-notes",
  imports: [FormField],
  templateUrl: "./input-notes.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNotesComponent implements FormValueControl<GedcomNote[]> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly value = model<GedcomNote[]>([]);
  readonly form = form(this.value);
  readonly open = input<boolean>(false);

  appendNote() {
    this.value.update((notes) => [...notes, newGedcomNote()]);
  }

  removeNote(index: number) {
    this.value.update((notes) => notes.toSpliced(index, 1));
  }
}
