import { Component, computed, input } from "@angular/core";
import { FormField, type FieldTree } from "@angular/forms/signals";
import { produce } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";
import { syncFamilyLinks } from "../../util/family-links";
import { InputFamilyChildrenComponent } from "./input-family-children.component";
import { InputFamilyFactsComponent } from "./input-family-facts.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

type FamilyMembers = Pick<
  GedcomFamily,
  "husbandXref" | "wifeXref" | "childXrefs"
>;

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
export class InputFamilyComponent {
  // The editor's whole form, not just this family's, because the family
  // owns membership: changing HUSB/WIFE/CHIL also changes the members'
  // FAMS/FAMC, and both sides are written together.
  readonly databaseForm = input.required<FieldTree<GedcomDatabase>>();
  readonly xref = input.required<string>();

  readonly workingDatabase = computed(() => this.databaseForm()().value());
  readonly form = computed(() => {
    const familyForm = this.databaseForm().families[this.xref()];
    if (!familyForm) throw new Error(`No family ${this.xref()}`);
    return familyForm;
  });
  readonly family = computed(() => this.form()().value());

  // Writes the family's new members and every affected individual's
  // FAMS/FAMC in one update, so the two sides never disagree. A write
  // that isn't from a bound control doesn't mark the form dirty, so mark
  // the family dirty here.
  updateMembers(members: Partial<FamilyMembers>) {
    const before = this.workingDatabase();
    const edited = produce(before, (draft) => {
      const family = draft.families[this.xref()];
      if (family) Object.assign(family, members);
    });
    this.databaseForm()().value.set(syncFamilyLinks(before, edited));
    this.form()().markAsDirty();
  }
}
