import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomEvent } from "../gedcom/gedcomEvent";
import { gedcomEventTags } from "../gedcom/gedcomEvent";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import type { ElementRef, QueryList } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  ViewChildren,
  input,
  model,
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-individual-events",
  imports: [
    FormField,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-individual-events.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputIndividualEventsComponent implements FormValueControl<
  GedcomEvent[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly open = input<boolean>(false);

  readonly value = model<GedcomEvent[]>([]);
  readonly form = form(this.value);

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendEvent() {
    this.value.update((events) => [
      ...events,
      {
        tag: "EVEN",
        type: "",
        address: "",
        place: "",
        cause: "",
        date: { value: "" },
        sortDate: { value: "" },
        value: "",
        citations: [],
        sharedWith: [],
        notes: [],
      },
    ]);
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeEvent(index: number) {
    this.value.update((events) => events.toSpliced(index, 1));
  }

  readonly gedcomEventTags = gedcomEventTags
    .entries()
    .toArray()
    .map(([tag, description]) => ({ tag, description }));
}
