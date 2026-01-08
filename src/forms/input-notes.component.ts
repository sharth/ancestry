import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomNote } from "../gedcom/gedcomNote";
import type { ElementRef, QueryList } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  ViewChildren,
  input,
  model,
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-notes",
  imports: [FormField],
  templateUrl: "./input-notes.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNotesComponent implements FormValueControl<GedcomNote[]> {
  readonly value = model<GedcomNote[]>([]);
  readonly form = form(this.value);

  readonly open = input<boolean>(false);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<ElementRef<HTMLElement>>;

  appendNote() {
    this.value.update((notes) => [...notes, { text: "" }]);
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeNote(index: number) {
    this.value.update((notes) => notes.toSpliced(index, 1));
  }
}
