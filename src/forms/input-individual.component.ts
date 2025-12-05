import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomDate } from "../gedcom/gedcomDate";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import { InputIndividualEventsComponent } from "./input-individual-events.component";
import { InputIndividualNamesComponent } from "./input-individual-names.component";
import { InputIndividualSexComponent } from "./input-individual-sex.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import type { OnInit } from "@angular/core";
import { Component, effect, input, model, signal } from "@angular/core";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-individual",
  imports: [
    Field,
    InputIndividualEventsComponent,
    InputIndividualSexComponent,
    InputIndividualNamesComponent,
    InputUnknownRecordsComponent,
    InputNotesComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualComponent implements OnInit {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly xref = input.required<string>();
  readonly open = input<boolean>(false);

  readonly individual = signal<GedcomIndividual>({
    xref: "",
    names: [],
    events: [],
    sex: {
      sex: "",
      citations: [],
    },
    childOfFamilyXrefs: [],
    parentOfFamilyXrefs: [],
    notes: [],
    unknownRecords: [],
  });
  readonly form = form<GedcomIndividual>(this.individual);

  readonly updateAngularDatabase = effect(() => {
    const now: GedcomDate = {
      value: new Date()
        .toLocaleString("en-gb", { dateStyle: "medium" })
        .toLocaleUpperCase(),
    };
    const individual = {
      ...this.individual(),
      changeDate: { date: now },
    };
    if (individual.xref !== "") {
      this.ancestryDatabase.update((ancestryDatabase) => {
        const individuals = new Map(ancestryDatabase.individuals);
        individuals.set(individual.xref, individual);
        return { ...ancestryDatabase, individuals };
      });
    }
  });

  ngOnInit(): void {
    this.individual.set(
      this.ancestryDatabase().individuals.get(this.xref()) ?? {
        xref: this.xref(),
        names: [],
        events: [],
        sex: { sex: "", citations: [] },
        childOfFamilyXrefs: [],
        parentOfFamilyXrefs: [],
        notes: [],
        unknownRecords: [],
      },
    );
  }
}
