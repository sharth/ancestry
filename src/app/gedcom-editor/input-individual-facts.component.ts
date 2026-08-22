import {
  Component,
  Injector,
  afterNextRender,
  inject,
  input,
  model,
} from "@angular/core";
import {
  FormField,
  form,
  type FieldTree,
  type FormValueControl,
} from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
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

  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomFact[]>([]);
  readonly form = form(this.value);

  readonly newControls = new WeakSet<FieldTree<GedcomFact, number>>();

  appendEvent() {
    this.value.update((events) => [...events, newGedcomFact()]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newControl = this.form[this.form.length - 1]!;
    this.newControls.add(newControl);
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
