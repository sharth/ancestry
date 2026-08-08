import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  input,
  model,
  type ElementRef,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../database/ancestry.service";
import { displayGedcomName } from "../gedcom/gedcomName";

@Component({
  selector: "app-input-individual-xref",
  imports: [FormField],
  templateUrl: "./input-individual-xref.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputIndividualXrefComponent implements FormValueControl<string> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);

  public readonly Object = Object;
  public readonly displayGedcomName = displayGedcomName;

  @ViewChild("focusTarget") private focusTarget!: ElementRef<HTMLElement>;
  public focus() {
    this.focusTarget.nativeElement.focus();
  }
}
