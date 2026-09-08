import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSource, type GedcomSource } from "../../gedcom/gedcomSource";
import { InputChangeDateComponent } from "./input-change-date.component";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputRepositoryLinksComponent } from "./input-repository-links.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";

@Component({
  selector: "app-input-source",
  imports: [
    FormField,
    InputMultimediaLinksComponent,
    InputRepositoryLinksComponent,
    InputUnknownRecordsComponent,
    InputChangeDateComponent,
  ],
  templateUrl: "./input-source.component.html",
  styleUrl: "./input.component.css",
})
export class InputSourceComponent implements FormValueControl<GedcomSource> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomSource>(newGedcomSource({ xref: "" }));
  readonly form = form(this.value);
}
