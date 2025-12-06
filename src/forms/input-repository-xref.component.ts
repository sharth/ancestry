import type { AncestryDatabase } from "../database/ancestry.service";
import type { ElementRef } from "@angular/core";
import { Component, ViewChild, computed, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-repository-xref",
  imports: [Field],
  templateUrl: "./input-repository-xref.component.html",
  styleUrl: "./input.component.css",
})
export class InputRepositoryXrefComponent implements FormValueControl<string> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);

  readonly repositories = computed(() =>
    Object.values(this.ancestryDatabase().repositories),
  );

  @ViewChild("selectElement")
  private selectElement!: ElementRef<HTMLSelectElement>;

  focus() {
    this.selectElement.nativeElement.focus();
  }
}
