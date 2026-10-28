import {
  Component,
  Injector,
  afterNextRender,
  inject,
  input,
  model,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import { InputIndividualFactComponent } from "./input-individual-fact.component";

@Component({
  selector: "app-input-individual-facts",
  imports: [FormField, InputIndividualFactComponent],
  templateUrl: "./input-individual-facts.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFactsComponent implements FormValueControl<
  GedcomFact[]
> {
  private readonly _injector = inject(Injector);

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(true);
  readonly value = model<GedcomFact[]>([]);
  readonly form = form(this.value);

  appendEvent() {
    this.value.update((events) => [...events, newGedcomFact()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newControl = this.form[this.form.length - 1]!;
    afterNextRender(
      {
        read: () => {
          newControl().focusBoundControl();
        },
      },
      { injector: this._injector },
    );
  }

  removeEvent(index: number) {
    this.value.update((events) => events.toSpliced(index, 1));
  }
}
