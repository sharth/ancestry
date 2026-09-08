import { Component, effect, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import {
  newGedcomChangeDate,
  type GedcomChangeDate,
} from "../../gedcom/gedcomChangeDate";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

@Component({
  selector: "app-input-change-date",
  imports: [],
  template: "",
})
export class InputChangeDateComponent implements FormValueControl<GedcomChangeDate> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomChangeDate>(newGedcomChangeDate());

  readonly changeDateEffect = effect(() => {
    const today = new Date()
      .toLocaleString("en-gb", { dateStyle: "medium" })
      .toLocaleUpperCase();
    if (this.value().value !== today) {
      this.value.update((gedcomChangeDate) => ({
        ...gedcomChangeDate,
        value: today,
      }));
    }
  });
}
