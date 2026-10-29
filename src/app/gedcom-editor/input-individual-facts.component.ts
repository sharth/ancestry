import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
  type ElementRef,
} from "@angular/core";
import {
  FormField,
  form,
  type FieldTree,
  type FormValueControl,
} from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyFacts,
  gedcomIndividualFacts,
  type GedcomEventMetadata,
} from "../../gedcom/gedcomFactMetadata";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputFamilyFactComponent } from "./input-family-fact.component";
import { InputIndividualFactComponent } from "./input-individual-fact.component";

const NEW_SPOUSE = "new";

@Component({
  selector: "app-input-individual-facts",
  imports: [FormField, InputFamilyFactComponent, InputIndividualFactComponent],
  templateUrl: "./input-individual-facts.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFactsComponent implements FormValueControl<
  GedcomFact[]
> {
  private readonly _injector = inject(Injector);
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(true);
  // The individual these facts belong to. Inside the editor, the facts of
  // the individual's spouse families are listed alongside their own, and a
  // new event can be a couple's event (Marriage, Divorce, ...).
  readonly individualXref = input<string>("");
  readonly value = model<GedcomFact[]>([]);
  readonly form = form(this.value);

  readonly NEW_SPOUSE = NEW_SPOUSE;
  readonly individualTags = sortedTags(gedcomIndividualFacts);
  readonly coupleTags = sortedTags(
    Object.fromEntries(
      Object.entries(gedcomFamilyFacts).filter(
        ([tag]) => !(tag in gedcomIndividualFacts),
      ),
    ),
  );

  // A new event whose type hasn't been chosen yet (""), or a couple's event
  // waiting for its spouse. It isn't stored on any record until then, since
  // GEDCOM only allows couple events on the family.
  readonly pendingTag = signal<string | undefined>(undefined);
  private readonly pendingTagSelect =
    viewChild<ElementRef<HTMLSelectElement>>("pendingTagSelect");

  private readonly inEditor = computed(
    () => this.gedcomEditor !== null && this.individualXref() !== "",
  );

  readonly spouseFamilies = computed(() => {
    const editor = this.gedcomEditor;
    if (!editor || !this.inEditor()) return [];
    const individual =
      this.workingDatabase().individuals[this.individualXref()];
    return (individual?.parentOfFamilyXrefs ?? []).flatMap((xref) => {
      const facts = editor.familyFactsField(xref);
      return facts ? [{ xref, facts }] : [];
    });
  });

  readonly spouseCandidates = computed(() =>
    Object.values(this.workingDatabase().individuals)
      .filter((individual) => individual.xref !== this.individualXref())
      .map((individual) => {
        const name = individual.names.at(0);
        return {
          xref: individual.xref,
          label: (name ? displayGedcomName(name) : "") || individual.xref,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  eventCount(): number {
    return this.spouseFamilies().reduce(
      (count, family) => count + family.facts().value().length,
      this.form.length,
    );
  }

  appendEvent() {
    if (this.inEditor()) {
      this.pendingTag.set("");
      afterNextRender(
        { read: () => this.pendingTagSelect()?.nativeElement.focus() },
        { injector: this._injector },
      );
      return;
    }
    this.appendIndividualEvent(newGedcomFact());
  }

  private appendIndividualEvent(fact: GedcomFact) {
    this.value.update((events) => [...events, fact]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newControl = this.form[this.form.length - 1]!;
    afterNextRender(
      {
        read: () => {
          newControl().focusBoundControl();
        },
      },
      { injector: this._injector },
    );
  }

  removeEvent(index: number) {
    this.value.update((events) => events.toSpliced(index, 1));
  }

  choosePendingTag(tag: string) {
    if (tag in gedcomIndividualFacts) {
      this.pendingTag.set(undefined);
      this.appendIndividualEvent(newGedcomFact({ tag }));
    } else {
      this.pendingTag.set(tag);
    }
  }

  choosePendingSpouse(spouseXref: string) {
    const editor = this.gedcomEditor;
    const tag = this.pendingTag();
    if (!editor || !tag) return;
    const individualXref = this.individualXref();
    this.pendingTag.set(undefined);
    editor.addFactToSpouseFamily(
      individualXref,
      this.resolveSpouse(spouseXref),
      newGedcomFact({ tag }),
    );
  }

  spouseOf(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    return family?.husbandXref === this.individualXref()
      ? family.wifeXref
      : (family?.husbandXref ?? "");
  }

  changeSpouse(familyXref: string, factIndex: number, spouseXref: string) {
    const editor = this.gedcomEditor;
    if (!editor) return;
    const individualXref = this.individualXref();
    editor.moveFamilyFact(
      individualXref,
      familyXref,
      factIndex,
      this.resolveSpouse(spouseXref),
    );
  }

  removeFamilyEvent(facts: FieldTree<GedcomFact[]>, index: number) {
    facts().value.update((events) => events.toSpliced(index, 1));
    facts().markAsDirty();
  }

  // "New person…" creates the spouse (and opens them in a tab to fill in).
  private resolveSpouse(spouseXref: string): string {
    return spouseXref === NEW_SPOUSE && this.gedcomEditor
      ? this.gedcomEditor.openNewIndividual()
      : spouseXref;
  }
}

function sortedTags(facts: Record<string, GedcomEventMetadata>) {
  return Object.entries(facts)
    .map(([tag, metadata]) => ({ tag, ...metadata }))
    .sort((a, b) =>
      a.humanReadableDescription.localeCompare(b.humanReadableDescription),
    );
}
