import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomName } from "../gedcom/gedcomName";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import type { ElementRef, QueryList } from "@angular/core";
import { Component, ViewChildren, input, model } from "@angular/core";
import type { FieldTree, FormValueControl } from "@angular/forms/signals";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-individual-names",
  imports: [Field, InputSourceCitationsComponent],
  templateUrl: "./input-individual-names.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualNamesComponent implements FormValueControl<
  GedcomName[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  // Set true to expand the details by default.
  readonly open = input<boolean>(false);

  readonly value = model<GedcomName[]>([]);
  readonly form = form(this.value);

  // Keep track of the controls that were added by a user interation.
  readonly newControls = new WeakSet<FieldTree<GedcomName, number>>([]);

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendName() {
    this.value.update((names) => [
      ...names,
      {
        prefix: "",
        givenName: "",
        nickName: "",
        surnamePrefix: "",
        surname: "",
        suffix: "",
        nameType: "",
        citations: [],
        notes: [],
      },
    ]);
    this.newControls.add(this.form[-1]!);
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeName(index: number) {
    this.value.update((names) => names.toSpliced(index, 1));
  }
}
