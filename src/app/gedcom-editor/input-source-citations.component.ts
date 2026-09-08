import {
  Component,
  ViewChildren,
  input,
  model,
  type QueryList,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomSourceCitation,
  type GedcomSourceCitation,
} from "../../gedcom/gedcomSourceCitation";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputSourceXrefComponent } from "./input-source-xref.component";

@Component({
  selector: "app-input-source-citations",
  imports: [
    FormField,
    InputSourceXrefComponent,
    InputNotesComponent,
    InputMultimediaLinksComponent,
  ],
  templateUrl: "./input-source-citations.component.html",
  styleUrl: "./input.component.css",
})
export class InputSourceCitationsComponent implements FormValueControl<
  GedcomSourceCitation[]
> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomSourceCitation[]>([]);
  readonly form = form(this.value);

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<InputSourceXrefComponent>;

  appendCitation() {
    this.value.update((citations) => [...citations, newGedcomSourceCitation()]);
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeCitation(index: number) {
    this.value.update((citations) => citations.toSpliced(index, 1));
  }
}
