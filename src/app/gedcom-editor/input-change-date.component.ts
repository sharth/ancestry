import { Component, effect, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  newGedcomChangeDate,
  type GedcomChangeDate,
} from "../../gedcom/gedcomChangeDate";

@Component({
  selector: "app-input-change-date",
  imports: [],
  template: "",
})
export class InputChangeDateComponent implements FormValueControl<GedcomChangeDate> {
  readonly workingDatabase = input.required<AncestryDatabase>();
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
