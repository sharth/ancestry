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
import { gedcomFamilyFacts } from "../../gedcom/gedcomFactMetadata";
import { InputFactComponent } from "./input-fact.component";

@Component({
  selector: "app-input-family-facts",
  imports: [FormField, InputFactComponent],
  templateUrl: "./input-family-facts.component.html",
  styleUrl: "./input.component.css",
})
export class InputFamilyFactsComponent implements FormValueControl<
  GedcomFact[]
> {
  private readonly _injector = inject(Injector);

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(true);
  readonly value = model<GedcomFact[]>([]);
  readonly form = form(this.value);
  readonly tags = gedcomFamilyFacts;

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
