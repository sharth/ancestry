import type { AncestryDatabase } from "../database/ancestry.service";
import { type GedcomSource, newGedcomSource } from "../gedcom/gedcomSource";
import { InputChangeDateComponent } from "./input-change-date.component";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputRepositoryLinksComponent } from "./input-repository-links.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import { ChangeDetectionStrategy, Component, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSourceComponent implements FormValueControl<GedcomSource> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomSource>(newGedcomSource(""));
  readonly form = form(this.value);
}
