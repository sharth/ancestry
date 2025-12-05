import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomEventSharedWith } from "../gedcom/gedcomEvent";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";
import type { QueryList } from "@angular/core";
import { Component, ViewChildren, model } from "@angular/core";
import type { FieldTree, FormValueControl } from "@angular/forms/signals";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-shared-with",
  imports: [Field, InputIndividualXrefComponent],
  templateUrl: "./input-shared-with.component.html",
  styleUrl: "./input.component.css",
})
export class InputSharedWithComponent implements FormValueControl<
  GedcomEventSharedWith[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomEventSharedWith[]>([]);
  readonly form = form(this.value);

  readonly newControls = new WeakSet<FieldTree<GedcomEventSharedWith, number>>(
    [],
  );

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<InputIndividualXrefComponent>;

  appendSharedEvent() {
    this.value.update((sharedWith) => [...sharedWith, { xref: "", role: "" }]);
    this.newControls.add(this.form[-1]);
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeSharedEvent(index: number) {
    this.value.update((sharedWith) => sharedWith.toSpliced(index, 1));
  }
}
