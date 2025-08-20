import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomEvent, GedcomEventSharedWith } from "../gedcom/gedcomEvent";
import { gedcomEventTags } from "../gedcom/gedcomEvent";
import { InputCitationsComponent } from "./input-citations.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { Component, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: "app-input-events",
  imports: [
    ReactiveFormsModule,
    InputCitationsComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-events.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputEventsComponent,
      multi: true,
    },
  ],
})
export class InputEventsComponent implements ControlValueAccessor {
  readonly formBuilder = inject(NonNullableFormBuilder);
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
    }),
  ]);

  constructor() {
    this.formArray.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(
        this.formArray.getRawValue().map((event) => ({
          tag: event.tag,
          type: event.type || undefined,
          address: event.address || undefined,
          place: event.place || undefined,
          cause: event.cause || undefined,
          date: event.date ? { value: event.date } : undefined,
          sdate: event.sortDate ? { value: event.sortDate } : undefined,
          value: event.value || undefined,
          citations: event.citations,
          sharedWith: event.sharedWith,
          notes: [],
        })),
      );
    });

    this.formArray.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.formArray.touched) {
        this.onTouch();
      }
    });
  }

  writeValue(events: GedcomEvent[]): void {
    this.formArray.clear({ emitEvent: false });
    for (const event of events) {
      this.formArray.push(
        this.formBuilder.group({
          tag: event.tag,
          type: event.type ?? "",
          address: event.address ?? "",
          place: event.place ?? "",
          cause: event.cause ?? "",
          date: event.date?.value ?? "",
          sortDate: event.sortDate?.value ?? "",
          value: event.value ?? "",
          citations: this.formBuilder.control(event.citations),
          sharedWith: this.formBuilder.control(event.sharedWith),
        }),
        { emitEvent: false },
      );
    }
  }

  registerOnChange(fn: (events: GedcomEvent[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

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
      }),
    );
  }

  removeEvent(index: number) {
    this.formArray.removeAt(index);
  }

  readonly gedcomEventTags = gedcomEventTags
    .entries()
    .toArray()
    .map(([tag, description]) => ({ tag, description }));

  private onChange!: (events: GedcomEvent[]) => void;
  private onTouch!: () => void;
}
