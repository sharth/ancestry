import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomEvent, GedcomEventSharedWith } from "../gedcom/gedcomEvent";
import { gedcomEventTags } from "../gedcom/gedcomEvent";
import type { GedcomNote } from "../gedcom/gedcomNote";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import type { ElementRef, QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  input,
  model,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-individual-events",
  imports: [
    ReactiveFormsModule,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-individual-events.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputIndividualEventsComponent,
      multi: true,
    },
  ],
})
export class InputIndividualEventsComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly open = input<boolean>(false);

  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      tag: "",
      type: "",
      address: "",
      place: "",
      cause: "",
      date: "",
      sortDate: "",
      value: "",
      citations: this.formBuilder.control<GedcomCitation[]>([]),
      sharedWith: this.formBuilder.control<GedcomEventSharedWith[]>([]),
      notes: this.formBuilder.control<GedcomNote[]>([]),
    }),
  ]);

  writeValue(events: GedcomEvent[]): void {
    this.formArray.clear({ emitEvent: false });
    this.formArray.push(
      events.map((event) =>
        this.formBuilder.group({
          tag: event.tag,
          type: event.type,
          address: event.address,
          place: event.place,
          cause: event.cause,
          date: event.date?.value ?? "",
          sortDate: event.sortDate?.value ?? "",
          value: event.value,
          citations: this.formBuilder.control(event.citations),
          sharedWith: this.formBuilder.control(event.sharedWith),
          notes: this.formBuilder.control(event.notes),
        }),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(onChange: (events: GedcomEvent[]) => void): void {
    this.formArray.valueChanges
      .pipe(startWith(this.formArray.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(
          this.formArray.getRawValue().map((event) => ({
            tag: event.tag,
            type: event.type,
            address: event.address,
            place: event.place,
            cause: event.cause,
            date: event.date ? { value: event.date } : undefined,
            sortDate: event.sortDate ? { value: event.sortDate } : undefined,
            value: event.value,
            citations: event.citations,
            sharedWith: event.sharedWith,
            notes: event.notes,
          })),
        );
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formArray.statusChanges
      .pipe(startWith(this.formArray.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formArray.touched) {
          onTouch();
        }
      });
  }

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendEvent() {
    this.formArray.push(
      this.formBuilder.group({
        tag: "EVEN",
        type: "",
        address: "",
        place: "",
        cause: "",
        date: "",
        sortDate: "",
        value: "",
        citations: this.formBuilder.control<GedcomCitation[]>([]),
        sharedWith: this.formBuilder.control<GedcomEventSharedWith[]>([]),
        notes: this.formBuilder.control<GedcomNote[]>([]),
      }),
    );
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeEvent(index: number) {
    this.formArray.removeAt(index);
  }

  readonly gedcomEventTags = gedcomEventTags
    .entries()
    .toArray()
    .map(([tag, description]) => ({ tag, description }));
}
