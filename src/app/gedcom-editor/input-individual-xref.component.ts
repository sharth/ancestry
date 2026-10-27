import {
  Component,
  ViewChild,
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
  selector: "app-input-individual-xref",
  imports: [FormField],
  templateUrl: "./input-individual-xref.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualXrefComponent implements FormValueControl<string> {
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);

  public readonly Object = Object;
  public readonly displayGedcomName = displayGedcomName;

  createNewIndividual() {
    if (this.gedcomEditor) {
      this.value.set(this.gedcomEditor.openNewIndividual());
    }
  }

  @ViewChild("focusTarget") private focusTarget!: ElementRef<HTMLElement>;
  public focus() {
    this.focusTarget.nativeElement.focus();
  }
}
