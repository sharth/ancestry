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
  type ElementRef,
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
  type GedcomEventMetadata,
} from "../../gedcom/gedcomFactMetadata";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { calculateNextFamilyXref } from "../../util/next-xref";
import { InputFamilyFactComponent } from "./input-family-fact.component";
import { InputIndividualFactComponent } from "./input-individual-fact.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

// The events of one individual: their own facts, plus the facts of each of
// their spouse families (Marriage, Divorce, ...). The value is the whole
// database being edited, so that a couple event can be put on (or moved to)
// the family the individual shares with a spouse, creating it if needed.
@Component({
  selector: "app-input-individual-facts",
  imports: [
    FormField,
    InputFamilyFactComponent,
    InputIndividualFactComponent,
    InputIndividualXrefComponent,
  ],
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

  private readonly individual = computed(
    () => this.value().individuals[this.individualXref()],
  );

  private readonly spouseFamilyXrefs = computed(() =>
    (this.individual()?.parentOfFamilyXrefs ?? []).filter(
      (xref) => this.value().families[xref] !== undefined,
    ),
  );

  // How many facts each list holds: the individual's own, and each spouse
  // family's.
  private readonly shape = computed<Shape>(() => ({
    individual: this.individual()?.facts.length ?? 0,
    families: this.spouseFamilyXrefs().map(
      (xref) => [xref, this.value().families[xref]?.facts.length ?? 0] as const,
    ),
  }));

  // Every row gets a token that stays with it when its fact moves between
  // the individual and a family (picking a new spouse, or changing a
  // Marriage to a Census), so the row keeps its place on the screen. Rows
  // start out as the individual's facts followed by each family's.
  private nextToken = 0;
  private readonly layout = linkedSignal<Shape, Layout>({
    source: this.shape,
    computation: (shape, previous) =>
      previous && fits(previous.value, shape)
        ? previous.value
        : this.freshLayout(shape),
  });

  private freshLayout(shape: Shape): Layout {
    const tokens = (count: number) =>
      Array.from({ length: count }, () => this.nextToken++);
    const individual = tokens(shape.individual);
    const families = Object.fromEntries(
      shape.families.map(([xref, count]) => [xref, tokens(count)]),
    );
    return {
      order: [...individual, ...Object.values(families).flat()],
      individual,
      families,
    };
  }

  readonly rows = computed<Row[]>(() => {
    const layout = this.layout();
    const locations = new Map<number, Row>();
    const individualFacts = this.form.individuals[this.individualXref()]?.facts;
    layout.individual.forEach((token, index) => {
      const field = individualFacts?.[index];
      if (field) locations.set(token, { token, field, index });
    });
    for (const [familyXref, tokens] of Object.entries(layout.families)) {
      const familyFacts = this.form.families[familyXref]?.facts;
      tokens.forEach((token, index) => {
        const field = familyFacts?.[index];
        if (field) locations.set(token, { token, field, index, familyXref });
      });
    }
    return layout.order.flatMap((token) => locations.get(token) ?? []);
  });

  eventCount(): number {
    return this.rows().length;
  }

  appendEvent() {
    this.pendingTag.set("");
    afterNextRender(
      { read: () => this.pendingTagSelect()?.nativeElement.focus() },
      { injector: this._injector },
    );
  }

  choosePendingTag(tag: string) {
    if (!(tag in gedcomIndividualFacts)) {
      this.pendingTag.set(tag);
      return;
    }
    const layout = this.layout();
    const token = this.nextToken++;
    this.pendingTag.set(undefined);
    this.edit((draft) => {
      draft.individuals[this.individualXref()]?.facts.push(
        newGedcomFact({ tag }),
      );
    });
    this.layout.set({
      ...layout,
      order: [...layout.order, token],
      individual: [...layout.individual, token],
    });
    this.focusLastIndividualFact();
  }

  choosePendingSpouse(spouseXref: string) {
    const tag = this.pendingTag();
    if (!tag) return;
    const layout = this.layout();
    const token = this.nextToken++;
    let familyXref = "";
    this.edit((draft) => {
      familyXref = this.spouseFamily(draft, spouseXref);
      draft.families[familyXref]?.facts.push(newGedcomFact({ tag }));
    });
    if (!familyXref) return;
    this.pendingTag.set(undefined);
    this.layout.set({
      ...layout,
      order: [...layout.order, token],
      families: {
        ...layout.families,
        [familyXref]: [...(layout.families[familyXref] ?? []), token],
      },
    });
  }

  removeEvent(row: Row) {
    const layout = this.layout();
    const familyXref = row.familyXref;
    this.edit((draft) => {
      const facts = familyXref
        ? draft.families[familyXref]?.facts
        : draft.individuals[this.individualXref()]?.facts;
      facts?.splice(row.index, 1);
    });
    this.layout.set({
      order: layout.order.filter((token) => token !== row.token),
      individual: familyXref
        ? layout.individual
        : layout.individual.toSpliced(row.index, 1),
      families: familyXref
        ? {
            ...layout.families,
            [familyXref]: (layout.families[familyXref] ?? []).toSpliced(
              row.index,
              1,
            ),
          }
        : layout.families,
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
    const fromFamilyXref = row.familyXref;
    if (!fromFamilyXref) return;
    const layout = this.layout();
    let toFamilyXref = "";
    this.edit((draft) => {
      toFamilyXref = this.spouseFamily(draft, spouseXref);
      if (!toFamilyXref || toFamilyXref === fromFamilyXref) return;
      const [fact] =
        draft.families[fromFamilyXref]?.facts.splice(row.index, 1) ?? [];
      if (fact) draft.families[toFamilyXref]?.facts.push(fact);
    });
    if (!toFamilyXref || toFamilyXref === fromFamilyXref) return;
    this.layout.set({
      ...layout,
      families: {
        ...layout.families,
        [fromFamilyXref]: (layout.families[fromFamilyXref] ?? []).toSpliced(
          row.index,
          1,
        ),
        [toFamilyXref]: [...(layout.families[toFamilyXref] ?? []), row.token],
      },
    });
  }

  // A family event changed to a type an individual can have (e.g. Marriage
  // to Census) becomes the individual's own event, in the same row.
  familyTagPicked(row: Row, tag: string) {
    const familyXref = row.familyXref;
    if (!familyXref || !(tag in gedcomIndividualFacts)) return;
    const layout = this.layout();
    this.edit((draft) => {
      const [fact] =
        draft.families[familyXref]?.facts.splice(row.index, 1) ?? [];
      if (fact) draft.individuals[this.individualXref()]?.facts.push(fact);
    });
    this.layout.set({
      ...layout,
      individual: [...layout.individual, row.token],
      families: {
        ...layout.families,
        [familyXref]: (layout.families[familyXref] ?? []).toSpliced(
          row.index,
          1,
        ),
      },
    });
    this.focusLastIndividualFact();
  }

  private edit(recipe: (draft: Draft<GedcomDatabase>) => void) {
    this.value.update((database) => produce(database, recipe));
  }

  // The family where the individual and `spouseXref` are husband and wife.
  // If they don't have one, it is created and linked from both sides
  // (HUSB/WIFE on the family, FAMS on each individual). "" if there's no
  // spouse to pair with.
  private spouseFamily(
    draft: Draft<GedcomDatabase>,
    spouseXref: string,
  ): string {
    const individualXref = this.individualXref();
    if (!spouseXref || spouseXref === individualXref) return "";

    // The draft only holds the records open in the editor, so look up the
    // spouse and their families in the whole database.
    const database = this.workingDatabase();
    const existingFamily = Object.values({
      ...database.families,
      ...draft.families,
    }).find(
      (family) =>
        (family.husbandXref === individualXref &&
          family.wifeXref === spouseXref) ||
        (family.husbandXref === spouseXref &&
          family.wifeXref === individualXref),
    );
    if (existingFamily) return existingFamily.xref;

    const familyXref = calculateNextFamilyXref({
      ...database,
      families: { ...database.families, ...draft.families },
    });
    const individual = draft.individuals[individualXref];
    const [husbandXref, wifeXref] =
      individual?.sex.sex === "F"
        ? [spouseXref, individualXref]
        : [individualXref, spouseXref];
    draft.families[familyXref] = newGedcomFamily({
      xref: familyXref,
      husbandXref,
      wifeXref,
    });
    individual?.parentOfFamilyXrefs.push(familyXref);
    const spouse =
      draft.individuals[spouseXref] ?? database.individuals[spouseXref];
    if (spouse) {
      draft.individuals[spouseXref] = {
        ...spouse,
        parentOfFamilyXrefs: [...spouse.parentOfFamilyXrefs, familyXref],
      };
    }
    return familyXref;
  }

  private focusLastIndividualFact() {
    const facts = this.form.individuals[this.individualXref()]?.facts;
    const newControl = facts?.[facts.length - 1];
    afterNextRender(
      { read: () => newControl?.().focusBoundControl() },
      { injector: this._injector },
    );
  }
}

interface Shape {
  individual: number;
  families: (readonly [string, number])[];
}

interface Layout {
  order: number[];
  individual: number[];
  families: Record<string, number[]>;
}

export interface Row {
  token: number;
  field: FieldTree<GedcomFact>;
  index: number;
  // Set when the fact is on a spouse family rather than the individual.
  familyXref?: string;
}

// Whether the layout still has one token per fact in every list. A family
// not in the layout yet (just created) fits if it has no facts.
function fits(layout: Layout, shape: Shape): boolean {
  return (
    layout.individual.length === shape.individual &&
    shape.families.every(
      ([xref, count]) => (layout.families[xref]?.length ?? 0) === count,
    ) &&
    Object.entries(layout.families).every(
      ([xref, tokens]) =>
        tokens.length === 0 || shape.families.some(([other]) => other === xref),
    )
  );
}

function sortedTags(facts: Record<string, GedcomEventMetadata>) {
  return Object.entries(facts)
    .map(([tag, metadata]) => ({ tag, ...metadata }))
    .sort((a, b) =>
      a.humanReadableDescription.localeCompare(b.humanReadableDescription),
    );
}
