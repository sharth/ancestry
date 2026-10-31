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

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyFacts,
  gedcomIndividualFacts,
  type GedcomEventMetadata,
} from "../../gedcom/gedcomFactMetadata";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputFamilyFactComponent } from "./input-family-fact.component";
import { InputIndividualFactComponent } from "./input-individual-fact.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

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

  // How many facts each list holds: the individual's own, and each spouse
  // family's.
  private readonly shape = computed<Shape>(() => ({
    individual: this.value().length,
    families: this.spouseFamilies().map(
      (family) => [family.xref, family.facts().value().length] as const,
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
    const families = new Map(
      this.spouseFamilies().map((family) => [family.xref, family.facts]),
    );
    const locations = new Map<number, Row>();
    layout.individual.forEach((token, index) => {
      const field = this.form[index];
      if (field) locations.set(token, { token, field, index });
    });
    for (const [familyXref, tokens] of Object.entries(layout.families)) {
      const facts = families.get(familyXref);
      tokens.forEach((token, index) => {
        const field = facts?.[index];
        if (facts && field) {
          locations.set(token, { token, field, index, familyXref, facts });
        }
      });
    }
    return layout.order.flatMap((token) => locations.get(token) ?? []);
  });

  eventCount(): number {
    return this.rows().length;
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
    const layout = this.layout();
    const token = this.nextToken++;
    this.value.update((events) => [...events, fact]);
    this.layout.set({
      ...layout,
      order: [...layout.order, token],
      individual: [...layout.individual, token],
    });
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
    const layout = this.layout();
    const token = layout.individual[index];
    this.value.update((events) => events.toSpliced(index, 1));
    this.layout.set({
      ...layout,
      order: layout.order.filter((other) => other !== token),
      individual: layout.individual.toSpliced(index, 1),
    });
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
    const tag = this.pendingTag();
    if (!tag) return;
    const layout = this.layout();
    const familyXref = this.spouseFamilyXref(spouseXref);
    const facts = familyXref && this.gedcomEditor?.familyFactsField(familyXref);
    if (!familyXref || !facts) return;
    const token = this.nextToken++;
    this.pendingTag.set(undefined);
    facts().value.update((events) => [...events, newGedcomFact({ tag })]);
    facts().markAsDirty();
    this.layout.set({
      ...layout,
      order: [...layout.order, token],
      families: {
        ...layout.families,
        [familyXref]: [...(layout.families[familyXref] ?? []), token],
      },
    });
  }

  spouseOf(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    return family?.husbandXref === this.individualXref()
      ? family.wifeXref
      : (family?.husbandXref ?? "");
  }

  // The family where the individual and `spouseXref` are husband and wife,
  // created if they don't have one yet. "" if there's no spouse to pair with.
  private spouseFamilyXref(spouseXref: string): string {
    const individualXref = this.individualXref();
    if (!this.gedcomEditor || !spouseXref || spouseXref === individualXref) {
      return "";
    }
    const existingFamily = Object.values(this.workingDatabase().families).find(
      (family) =>
        (family.husbandXref === individualXref &&
          family.wifeXref === spouseXref) ||
        (family.husbandXref === spouseXref &&
          family.wifeXref === individualXref),
    );
    return (
      existingFamily?.xref ??
      this.gedcomEditor.createSpouseFamily(individualXref, spouseXref)
    );
  }

  changeSpouse(
    familyXref: string,
    facts: FieldTree<GedcomFact[]>,
    factIndex: number,
    spouseXref: string,
  ) {
    const layout = this.layout();
    const fromTokens = layout.families[familyXref] ?? [];
    const token = fromTokens[factIndex];
    const fact = facts().value()[factIndex];
    if (token === undefined || fact === undefined) return;
    const toFamilyXref = this.spouseFamilyXref(spouseXref);
    const toFacts =
      toFamilyXref && this.gedcomEditor?.familyFactsField(toFamilyXref);
    if (!toFamilyXref || !toFacts || toFamilyXref === familyXref) return;
    facts().value.update((events) => events.toSpliced(factIndex, 1));
    facts().markAsDirty();
    toFacts().value.update((events) => [...events, fact]);
    toFacts().markAsDirty();
    this.layout.set({
      ...layout,
      families: {
        ...layout.families,
        [familyXref]: fromTokens.toSpliced(factIndex, 1),
        [toFamilyXref]: [...(layout.families[toFamilyXref] ?? []), token],
      },
    });
  }

  // A family event changed to a type an individual can have (e.g. Marriage
  // to Census) becomes the individual's own event, in the same row.
  familyTagPicked(
    familyXref: string,
    facts: FieldTree<GedcomFact[]>,
    factIndex: number,
    tag: string,
  ) {
    if (!(tag in gedcomIndividualFacts)) return;
    const layout = this.layout();
    const fromTokens = layout.families[familyXref] ?? [];
    const token = fromTokens[factIndex];
    const fact = facts().value()[factIndex];
    if (token === undefined || fact === undefined) return;
    facts().value.update((events) => events.toSpliced(factIndex, 1));
    facts().markAsDirty();
    this.value.update((events) => [...events, fact]);
    this.layout.set({
      ...layout,
      individual: [...layout.individual, token],
      families: {
        ...layout.families,
        [familyXref]: fromTokens.toSpliced(factIndex, 1),
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newControl = this.form[this.form.length - 1]!;
    afterNextRender(
      {
        read: () => {
          newControl.tag().focusBoundControl();
        },
      },
      { injector: this._injector },
    );
  }

  removeFamilyEvent(
    familyXref: string,
    facts: FieldTree<GedcomFact[]>,
    index: number,
  ) {
    const layout = this.layout();
    const tokens = layout.families[familyXref] ?? [];
    const token = tokens[index];
    facts().value.update((events) => events.toSpliced(index, 1));
    facts().markAsDirty();
    this.layout.set({
      ...layout,
      order: layout.order.filter((other) => other !== token),
      families: {
        ...layout.families,
        [familyXref]: tokens.toSpliced(index, 1),
      },
    });
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

interface Row {
  token: number;
  field: FieldTree<GedcomFact>;
  index: number;
  // Set when the fact is on a spouse family rather than the individual.
  familyXref?: string;
  facts?: FieldTree<GedcomFact[]>;
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
