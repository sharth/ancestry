import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomSourceCitation } from "../gedcom/gedcomSourceCitation";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputSourceXrefComponent } from "./input-source-xref.component";
import type { QueryList } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  ViewChildren,
  model,
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSourceCitationsComponent implements FormValueControl<
  GedcomSourceCitation[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomSourceCitation[]>([]);
  readonly form = form(this.value);

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<InputSourceXrefComponent>;

  appendCitation() {
    this.value.update((citations) => [
      ...citations,
      {
        sourceXref: "",
        notes: [],
        text: "",
        page: "",
        quality: "",
        multimediaLinks: [],
      },
    ]);
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeCitation(index: number) {
    this.value.update((citations) => citations.toSpliced(index, 1));
  }
}
