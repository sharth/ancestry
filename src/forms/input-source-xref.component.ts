import type { AncestryDatabase } from "../database/ancestry.service";
import { displayGedcomName } from "../gedcom/gedcomName";
import type { ElementRef } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  model,
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-source-xref",
  imports: [FormField],
  templateUrl: "./input-source-xref.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSourceXrefComponent implements FormValueControl<string> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<string>("");
  readonly form = form(this.value);

  readonly sources = computed(() =>
    Object.values(this.ancestryDatabase().sources),
  );

  public readonly displayGedcomName = displayGedcomName;

  @ViewChild("focusTarget")
  private focusTarget!: ElementRef<HTMLSelectElement>;

  focus() {
    this.focusTarget.nativeElement.focus();
  }
}
