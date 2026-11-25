import {
  Component,
  ViewChildren,
  input,
  model,
  type QueryList,
  inject,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomFactSharedWith } from "../../gedcom/gedcomFact";
import { IdGenerator } from "../../util/id-generator";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

@Component({
  selector: "app-input-shared-with",
  imports: [FormField, InputIndividualXrefComponent],
  templateUrl: "./input-shared-with.component.html",
  styleUrl: "./input.component.css",
  host: { "[class.empty-list]": "collapseWhenEmpty() && form.length === 0" },
})
export class InputSharedWithComponent implements FormValueControl<
  GedcomFactSharedWith[]
> {
  readonly id = inject(IdGenerator).getId("input-shared-with");
  readonly workingDatabase = input.required<GedcomDatabase>();
  /** Show only an add button, not a whole section, while the list is empty. */
  readonly collapseWhenEmpty = input(true);
  readonly value = model<GedcomFactSharedWith[]>([]);
  readonly form = form(this.value);

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<InputIndividualXrefComponent>;

  appendSharedEvent() {
    this.value.update((sharedWith) => [...sharedWith, { xref: "", role: "" }]);
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeSharedEvent(index: number) {
    this.value.update((sharedWith) => sharedWith.toSpliced(index, 1));
  }
}
