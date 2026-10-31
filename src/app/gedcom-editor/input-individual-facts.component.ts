import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  viewChild,
} from "@angular/core";
import {
  FormField,
  form,
  type FieldTree,
  type FormValueControl,
} from "@angular/forms/signals";
import { produce, type Draft } from "immer";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyFacts,
  gedcomIndividualFacts,
} from "../../gedcom/gedcomFactMetadata";
import { newGedcomFamily, type GedcomFamily } from "../../gedcom/gedcomFamily";
import { calculateNextFamilyXref } from "../../util/next-xref";
import { InputFactComponent } from "./input-fact.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

// The events of one individual: their own facts, plus the facts of each of
// their spouse families (Marriage, Divorce, ...). The value is the whole
// database being edited, so that a couple event can be put on (or moved to)
// the family the individual shares with a spouse, creating it if needed.
@Component({
  selector: "app-input-individual-facts",
  imports: [FormField, InputFactComponent, InputIndividualXrefComponent],
  templateUrl: "./input-individual-facts.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFactsComponent implements FormValueControl<GedcomDatabase> {
  private readonly _injector = inject(Injector);

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(true);
  readonly individualXref = input.required<string>();
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);

  readonly individualTags = gedcomIndividualFacts;
  readonly familyTags = gedcomFamilyFacts;

  // A couple event waits for its spouse before it's added, since GEDCOM only
  // allows it on the family the two share.
  readonly choosingSpouse = signal(false);
  private readonly spousePicker =
    viewChild<InputIndividualXrefComponent>("spousePicker");

  // Every event of the individual: their own facts, then each spouse
  // family's.
  private readonly events = computed<Row[]>(() => {
    const xref = this.individualXref();
    const familyXrefs = this.value().individuals[xref]?.parentOfFamilyXrefs;
    return [
      ...rowsOf(this.form.individuals[xref]?.facts),
      ...(familyXrefs ?? []).flatMap((familyXref) =>
        rowsOf(this.form.families[familyXref]?.facts, familyXref),
      ),
    ];
  });

  // The events in the order they're shown. An event keeps its row while it
  // is edited or moved between the individual and a family (picking a new
  // spouse, or changing a Marriage to a Census); new events go at the end.
  readonly rows = linkedSignal<Row[], Row[]>({
    source: this.events,
    computation: (events, previous) => {
      const positions = new Map(
        (previous?.value ?? []).map((row, position) => [row.id, position]),
      );
      const position = (row: Row) =>
        positions.get(row.id) ?? Number.MAX_SAFE_INTEGER;
      return events.toSorted((a, b) => position(a) - position(b));
    },
  });

  appendEvent() {
    const fact = newGedcomFact();
    this.edit((draft) => {
      draft.individuals[this.individualXref()]?.facts.push(fact);
    });
    this.focusEvent(fact.id);
  }

  appendCoupleEvent() {
    this.choosingSpouse.set(true);
    afterNextRender(
      { read: () => this.spousePicker()?.focus() },
      { injector: this._injector },
    );
  }

  spouseChosen(spouseXref: string) {
    if (!this.isSpouse(spouseXref)) return;
    this.choosingSpouse.set(false);
    const fact = newGedcomFact({ tag: "MARR" });
    this.edit((draft) => {
      this.spouseFamily(draft, spouseXref)?.facts.push(fact);
    });
    this.focusEvent(fact.id);
  }

  removeEvent(row: Row) {
    this.edit((draft) => {
      this.factsOf(draft, row).splice(row.index, 1);
    });
  }

  spouseOf(familyXref: string): string {
    const family = this.value().families[familyXref];
    return family?.husbandXref === this.individualXref()
      ? family.wifeXref
      : (family?.husbandXref ?? "");
  }

  // Moves a family's event to the family shared with `spouseXref` instead.
  changeSpouse(row: Row, spouseXref: string) {
    if (!this.isSpouse(spouseXref)) return;
    this.edit((draft) => {
      const family = this.spouseFamily(draft, spouseXref);
      if (!family) return;
      family.facts.push(...this.factsOf(draft, row).splice(row.index, 1));
    });
  }

  // A family event changed to a type an individual can have (e.g. Marriage
  // to Census) becomes the individual's own event, in the same row.
  familyTagPicked(row: Row, tag: string) {
    if (!(tag in gedcomIndividualFacts)) return;
    this.edit((draft) => {
      draft.individuals[this.individualXref()]?.facts.push(
        ...this.factsOf(draft, row).splice(row.index, 1),
      );
    });
    this.focusEvent(row.id);
  }

  private edit(recipe: (draft: Draft<GedcomDatabase>) => void) {
    this.value.update((database) => produce(database, recipe));
  }

  private factsOf(draft: Draft<GedcomDatabase>, row: Row): GedcomFact[] {
    const record = row.familyXref
      ? draft.families[row.familyXref]
      : draft.individuals[this.individualXref()];
    return record?.facts ?? [];
  }

  private isSpouse(xref: string): boolean {
    return xref !== "" && xref !== this.individualXref();
  }

  // The family where the individual and `spouseXref` are husband and wife.
  // If they don't have one, it is created and linked from both sides
  // (HUSB/WIFE on the family, FAMS on each individual).
  private spouseFamily(
    draft: Draft<GedcomDatabase>,
    spouseXref: string,
  ): Draft<GedcomFamily> | undefined {
    const individual = draft.individuals[this.individualXref()];
    if (!individual) return undefined;
    const existing = individual.parentOfFamilyXrefs
      .map((familyXref) => draft.families[familyXref])
      .find(
        (family) =>
          family?.husbandXref === spouseXref || family?.wifeXref === spouseXref,
      );
    if (existing) return existing;

    // The draft only holds the records open in the editor, so the new xref
    // and the spouse come from the whole database.
    const database = this.workingDatabase();
    const familyXref = calculateNextFamilyXref({
      ...database,
      families: { ...database.families, ...draft.families },
    });
    const [husbandXref, wifeXref] =
      individual.sex.sex === "F"
        ? [spouseXref, individual.xref]
        : [individual.xref, spouseXref];
    draft.families[familyXref] = newGedcomFamily({
      xref: familyXref,
      husbandXref,
      wifeXref,
    });
    individual.parentOfFamilyXrefs.push(familyXref);
    const spouse =
      draft.individuals[spouseXref] ?? database.individuals[spouseXref];
    if (spouse) {
      draft.individuals[spouseXref] = {
        ...spouse,
        parentOfFamilyXrefs: [...spouse.parentOfFamilyXrefs, familyXref],
      };
    }
    return draft.families[familyXref];
  }

  private focusEvent(id: number) {
    afterNextRender(
      {
        read: () =>
          this.rows()
            .find((row) => row.id === id)
            ?.field()
            .focusBoundControl(),
      },
      { injector: this._injector },
    );
  }
}

export interface Row {
  // The fact's id, which stays the same while it is edited or moved.
  id: number;
  field: FieldTree<GedcomFact>;
  index: number;
  // Set when the fact is on a spouse family rather than the individual.
  familyXref?: string;
}

function rowsOf(
  facts: FieldTree<GedcomFact[]> | undefined,
  familyXref?: string,
): Row[] {
  return (facts?.().value() ?? []).flatMap((fact, index) => {
    const field = facts?.[index];
    return field ? [{ id: fact.id, field, index, familyXref }] : [];
  });
}
