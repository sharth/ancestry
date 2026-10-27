import { Component, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";

import {
  newGedcomChangeDate,
  type GedcomChangeDate,
} from "../../gedcom/gedcomChangeDate";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

// CHAN auto-stamping on every render was removed: it rewrote the bound
// value to today's date as soon as this component was created, which
// Signal Forms treats as a genuine, dirtying change from the control
// (see GedcomEditorComponent.hasUnsavedChanges()), so opening the
// individual/source editor on any record whose stored CHAN date wasn't
// already today reported unsaved changes before the user touched
// anything. This component just holds the existing value unchanged
// rather than reintroducing stamping some other way.
@Component({
  selector: "app-input-change-date",
  imports: [],
  template: "",
})
export class InputChangeDateComponent implements FormValueControl<GedcomChangeDate> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomChangeDate>(newGedcomChangeDate());
}
