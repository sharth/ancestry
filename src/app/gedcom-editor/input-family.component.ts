import { Component, computed, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import { produce, type Draft } from "immer";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";
import { InputFamilyChildrenComponent } from "./input-family-children.component";
import { InputFamilyFactsComponent } from "./input-family-facts.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

type FamilyMembers = Pick<
  GedcomFamily,
  "husbandXref" | "wifeXref" | "childXrefs"
>;

// Edits one family, but its value is the whole database: the family owns
// membership, so changing HUSB/WIFE/CHIL also changes the members'
// FAMS/FAMC, and both sides are written together.
@Component({
  selector: "app-input-family",
  imports: [
    FormField,
    InputIndividualXrefComponent,
    InputFamilyChildrenComponent,
    InputFamilyFactsComponent,
    InputSourceCitationsComponent,
  ],
  templateUrl: "./input-family.component.html",
  styleUrl: "./input.component.css",
})
export class InputFamilyComponent implements FormValueControl<GedcomDatabase> {
  readonly xref = input.required<string>();
  // Set when the family is shown on one of its spouses' own editor, which
  // leaves out that spouse's picker: they leave the family from there.
  readonly spouseXref = input<string>();
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);

  readonly family = computed(() => this.value().families[this.xref()]);
  readonly familyForm = computed(() => this.form.families[this.xref()]);

  updateFamilyMembers(members: Partial<FamilyMembers>) {
    const familyXref = this.xref();
    this.value.update(
      produce((draft) => {
        setFamilyMembers(draft, familyXref, members);
      }),
    );
  }
}

// Sets some of a family's members, and updates the FAMS/FAMC of each member
// added or removed to match.
export function setFamilyMembers(
  draft: Draft<GedcomDatabase>,
  familyXref: string,
  members: Partial<FamilyMembers>,
) {
  const family = draft.families[familyXref];
  if (!family) return;
  const spousesBefore = [family.husbandXref, family.wifeXref];
  const childrenBefore = family.childXrefs;
  Object.assign(family, members);
  const spousesAfter = [family.husbandXref, family.wifeXref];
  const childrenAfter = family.childXrefs;

  const spousesAdded = spousesAfter.filter((x) => !spousesBefore.includes(x));
  const spousesRemoved = spousesBefore.filter((x) => !spousesAfter.includes(x));
  const childrenAdded = childrenAfter.filter(
    (x) => !childrenBefore.includes(x),
  );
  const childrenRemoved = childrenBefore.filter(
    (x) => !childrenAfter.includes(x),
  );

  for (const xref of spousesRemoved) {
    const spouse = draft.individuals[xref];
    if (spouse) {
      spouse.parentOfFamilyXrefs = spouse.parentOfFamilyXrefs.filter(
        (x) => x !== familyXref,
      );
    }
  }
  for (const xref of spousesAdded) {
    const spouse = draft.individuals[xref];
    if (spouse && !spouse.parentOfFamilyXrefs.includes(familyXref)) {
      spouse.parentOfFamilyXrefs.push(familyXref);
    }
  }
  for (const xref of childrenRemoved) {
    const child = draft.individuals[xref];
    if (child) {
      child.childOfFamilyXrefs = child.childOfFamilyXrefs.filter(
        (x) => x !== familyXref,
      );
    }
  }
  for (const xref of childrenAdded) {
    const child = draft.individuals[xref];
    if (child && !child.childOfFamilyXrefs.includes(familyXref)) {
      child.childOfFamilyXrefs.push(familyXref);
    }
  }
}
