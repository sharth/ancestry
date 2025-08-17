import { AncestryService } from "../database/ancestry.service";
import { monthNames } from "../gedcom/gedcomDate";
import type { GedcomEvent } from "../gedcom/gedcomEvent";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomName } from "../gedcom/gedcomName";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputEventsComponent } from "./input-events.component";
import { InputNamesComponent } from "./input-names.component";
import { InputSexComponent } from "./input-sex.component";
import { Component, inject } from "@angular/core";
import type { ControlValueAccessor } from "@angular/forms";
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: "app-input-individual",
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputNamesComponent,
    InputEventsComponent,
    InputSexComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputIndividualComponent,
      multi: true,
    },
  ],
})
export class InputIndividualComponent implements ControlValueAccessor {
  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly form = this.formBuilder.group({
    xref: this.formBuilder.control<string>(""),
    sex: this.formBuilder.control<GedcomSex | null>(null),
    names: this.formBuilder.control<GedcomName[]>([]),
    events: this.formBuilder.control<GedcomEvent[]>([]),
    childOfFamilies: this.formBuilder.control<string[]>([]),
    parentOfFamilies: this.formBuilder.control<string[]>([]),
  });

  writeValue(individual: GedcomIndividual | undefined): void {
    this.form.setValue(
      {
        // FIXME: If the xref (or individual) is not set, we should discover a new one.
        xref: individual?.xref ?? "",
        sex: individual?.sex ?? null,
        names: individual?.names ?? [],
        events: individual?.events ?? [],
        childOfFamilies: individual?.childOfFamilyXrefs ?? [],
        parentOfFamilies: individual?.parentOfFamilyXrefs ?? [],
      },
      { emitEvent: false },
    );
  }

  registerOnChange(
    fn: (individual: GedcomIndividual | undefined) => void,
  ): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  readonly formValueChanges = this.form.valueChanges.subscribe(() => {
    const now = new Date();
    const formValue = this.form.getRawValue();
    this.onChange({
      xref: formValue.xref,
      changeDate: {
        value: now
          .toLocaleString("en-gb", { dateStyle: "medium" })
          .toLocaleUpperCase(),
      },
      sex: formValue.sex ?? undefined,
      names: formValue.names,
      events: formValue.events,
      childOfFamilyXrefs: formValue.childOfFamilies,
      parentOfFamilyXrefs: formValue.parentOfFamilies,
      // FIXME: Very likely wrong.
      unknownRecords: [],
    });
  });

  readonly formStatusChanges = this.form.statusChanges.subscribe(() => {
    if (this.form.touched) {
      this.onTouch();
    }
  });

  ngOnDestroy(): void {
    this.formValueChanges.unsubscribe();
    this.formStatusChanges.unsubscribe();
  }

  private nextXref(individuals: GedcomIndividual[]): string {
    const individualXrefs = individuals.map((individual) => individual.xref);
    const nextXrefNumber = individualXrefs.reduce((nextXrefNumber, xref) => {
      const group = new RegExp(/^@[a-z]*(\d+)@$/, "i").exec(xref);
      return group
        ? Math.max(Number(group[1]) + 1, nextXrefNumber)
        : nextXrefNumber;
    }, 0);
    return `@I${nextXrefNumber}@`;
  }

  onChange!: (individual: GedcomIndividual | undefined) => void;
  onTouch!: () => void;
}
