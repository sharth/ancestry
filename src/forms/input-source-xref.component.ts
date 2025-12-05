import type { AncestryDatabase } from "../database/ancestry.service";
import { displayGedcomName } from "../gedcom/gedcomName";
import type { ElementRef } from "@angular/core";
import { Component, ViewChild, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-source-xref",
  imports: [Field],
  templateUrl: "./input-source-xref.component.html",
  styleUrl: "./input.component.css",
})
export class InputSourceXrefComponent implements FormValueControl<string> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<string>("");
  readonly form = form(this.value);

  public readonly displayGedcomName = displayGedcomName;

  @ViewChild("focusTarget")
  private focusTarget!: ElementRef<HTMLSelectElement>;

  focus() {
    this.focusTarget.nativeElement.focus();
  }
}
