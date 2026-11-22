import { Component, computed, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import { produce } from "immer";

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
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);

  readonly family = computed(() => this.value().families[this.xref()]);
  readonly familyForm = computed(() => this.form.families[this.xref()]);

  updateFamilyMembers(members: Partial<FamilyMembers>) {
    const familyXref = this.xref();
    this.value.update((database) =>
      produce(database, (draft) => {
        const family = draft.families[familyXref];
        if (!family) return;
        const spousesBefore = [family.husbandXref, family.wifeXref];
        const childrenBefore = family.childXrefs;
        Object.assign(family, members);
        const spousesAfter = [family.husbandXref, family.wifeXref];
        const childrenAfter = family.childXrefs;

        for (const xref of spousesBefore) {
          const individual = draft.individuals[xref];
          if (individual && !spousesAfter.includes(xref)) {
            individual.parentOfFamilyXrefs =
              individual.parentOfFamilyXrefs.filter((x) => x !== familyXref);
          }
        }
        for (const xref of spousesAfter) {
          const individual = draft.individuals[xref];
          if (
            individual &&
            !individual.parentOfFamilyXrefs.includes(familyXref)
          ) {
            individual.parentOfFamilyXrefs.push(familyXref);
          }
        }
        for (const xref of childrenBefore) {
          const individual = draft.individuals[xref];
          if (individual && !childrenAfter.includes(xref)) {
            individual.childOfFamilyXrefs =
              individual.childOfFamilyXrefs.filter((x) => x !== familyXref);
          }
        }
        for (const xref of childrenAfter) {
          const individual = draft.individuals[xref];
          if (
            individual &&
            !individual.childOfFamilyXrefs.includes(familyXref)
          ) {
            individual.childOfFamilyXrefs.push(familyXref);
          }
        }
      }),
    );
  }
}
