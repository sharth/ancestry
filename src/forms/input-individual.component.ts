import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomEvent } from "../gedcom/gedcomEvent";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomName } from "../gedcom/gedcomName";
import type { GedcomNote } from "../gedcom/gedcomNote";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputEventsComponent } from "./input-events.component";
import { InputNamesComponent } from "./input-names.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputSexComponent } from "./input-sex.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import type { OnInit } from "@angular/core";
import { Component, DestroyRef, inject, input, model } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-individual",
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputNamesComponent,
    InputEventsComponent,
    InputSexComponent,
    InputUnknownRecordsComponent,
    InputNotesComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly xref = input.required<string>();
  readonly open = input<boolean>(false);

  readonly form = this.formBuilder.group({
    xref: this.formBuilder.control<string>(""),
    sex: this.formBuilder.control<GedcomSex | null>(null),
    names: this.formBuilder.control<GedcomName[]>([]),
    events: this.formBuilder.control<GedcomEvent[]>([]),
    childOfFamilies: this.formBuilder.control<string[]>([]),
    parentOfFamilies: this.formBuilder.control<string[]>([]),
    notes: this.formBuilder.control<GedcomNote[]>([]),
    unknownRecords: this.formBuilder.control<GedcomRecord[]>([]),
  });

  ngOnInit(): void {
    const individual = this.ancestryDatabase().individuals.get(this.xref());
    this.form.setValue(
      {
        // FIXME: If the xref (or individual) is not set, we should discover a new one.
        xref: individual?.xref ?? "",
        sex: individual?.sex ?? null,
        names: individual?.names ?? [],
        events: individual?.events ?? [],
        childOfFamilies: individual?.childOfFamilyXrefs ?? [],
        parentOfFamilies: individual?.parentOfFamilyXrefs ?? [],
        notes: individual?.notes ?? [],
        unknownRecords: individual?.unknownRecords ?? [],
      },
      { emitEvent: false },
    );
    this.form.valueChanges
      .pipe(startWith(this.form.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const formValue = this.form.getRawValue();
        const individual: GedcomIndividual = {
          xref: formValue.xref,
          changeDate: {
            value: new Date()
              .toLocaleString("en-gb", { dateStyle: "medium" })
              .toLocaleUpperCase(),
          },
          sex: formValue.sex ?? undefined,
          names: formValue.names,
          events: formValue.events,
          childOfFamilyXrefs: formValue.childOfFamilies,
          parentOfFamilyXrefs: formValue.parentOfFamilies,
          notes: formValue.notes,
          unknownRecords: formValue.unknownRecords,
        };
        this.ancestryDatabase.update((ancestryDatabase) => {
          const individuals = new Map(ancestryDatabase.individuals);
          individuals.set(individual.xref, individual);
          return { ...ancestryDatabase, individuals };
        });
      });
  }
}
