import { Component, effect, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomChangeDate } from "../gedcom/gedcomChangeDate";

@Component({
  selector: "app-input-change-date",
  imports: [],
  template: "",
})
export class InputChangeDateComponent implements FormValueControl<GedcomChangeDate> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly value = model<GedcomChangeDate>({ date: { value: "" } });

  readonly changeDateEffect = effect(() => {
    const today = new Date()
      .toLocaleString("en-gb", { dateStyle: "medium" })
      .toLocaleUpperCase();
    if (this.value().date.value !== today) {
      this.value.set({ date: { value: today } });
    }
  });
}
