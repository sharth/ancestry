import {
  Component,
  ViewChild,
  computed,
  inject,
  input,
  model,
  type ElementRef,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";

@Component({
  selector: "app-input-source-xref",
  imports: [FormField],
  templateUrl: "./input-source-xref.component.html",
  styleUrl: "./input.component.css",
})
export class InputSourceXrefComponent implements FormValueControl<string> {
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<string>("");
  readonly form = form(this.value);

  readonly sources = computed(() =>
    Object.values(this.workingDatabase().sources),
  );

  public readonly displayGedcomName = displayGedcomName;

  createNewSource() {
    if (this.gedcomEditor) {
      this.value.set(this.gedcomEditor.openNewSource());
    }
  }

  @ViewChild("focusTarget")
  private focusTarget!: ElementRef<HTMLSelectElement>;

  focus() {
    this.focusTarget.nativeElement.focus();
  }
}
