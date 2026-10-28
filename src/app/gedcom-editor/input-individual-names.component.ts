import {
  Component,
  Injector,
  ViewChildren,
  afterNextRender,
  inject,
  input,
  model,
  type ElementRef,
  type QueryList,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomName, type GedcomName } from "../../gedcom/gedcomName";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-individual-names",
  imports: [FormField, InputSourceCitationsComponent],
  templateUrl: "./input-individual-names.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualNamesComponent implements FormValueControl<
  GedcomName[]
> {
  private readonly _injector = inject(Injector);

  readonly workingDatabase = input.required<GedcomDatabase>();

  // Set true to expand the details by default.
  readonly open = input<boolean>(true);

  readonly value = model<GedcomName[]>([]);
  readonly form = form(this.value);

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendName() {
    this.value.update((names) => [...names, newGedcomName()]);
    afterNextRender(
      {
        read: () => {
          this.focusTargets.last.nativeElement.focus();
        },
      },
      { injector: this._injector },
    );
  }

  removeName(index: number) {
    this.value.update((names) => names.toSpliced(index, 1));
  }
}
