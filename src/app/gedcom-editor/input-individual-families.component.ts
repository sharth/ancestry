import { Component, inject, input, model, signal } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import { produce, type Draft } from "immer";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { calculateNextFamilyXref } from "../../util/next-xref";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputFamilyFactsComponent } from "./input-family-facts.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

// The families an individual is part of, as a child or as a spouse. Each
// spouse family can be edited here: the other spouse, the children, and the
// family's events (e.g. the marriage). The value is the database being
// edited, since these edits change the family and its members together:
// GEDCOM links each family member both ways (FAMC/FAMS on the individual,
// HUSB/WIFE/CHIL on the family).
@Component({
  selector: "app-input-individual-families",
  imports: [FormField, InputFamilyFactsComponent, InputIndividualXrefComponent],
  templateUrl: "./input-individual-families.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFamiliesComponent implements FormValueControl<GedcomDatabase> {
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly individualXref = input.required<string>();
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);

  // The spouse family whose "Add child" picker is showing.
  readonly addingChildTo = signal<string | undefined>(undefined);

  individual(): GedcomIndividual | undefined {
    return this.value().individuals[this.individualXref()];
  }

  childOfFamilyLabel(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    const parents = [family?.husbandXref, family?.wifeXref]
      .map((xref) => this.individualLabel(xref ?? ""))
      .filter((label) => label !== "");
    return `Child of: ${parents.join(" & ") || "Unknown"} (${familyXref})`;
  }

  parentOfFamilyLabel(familyXref: string): string {
    const spouse = this.individualLabel(this.spouseOf(familyXref));
    return `Spouse in: ${spouse || "Unknown"} (${familyXref})`;
  }

  individualLabel(xref: string): string {
    const name = this.workingDatabase().individuals[xref]?.names.at(0);
    return (name ? displayGedcomName(name) : "") || xref;
  }

  spouseOf(familyXref: string): string {
    const family = this.value().families[familyXref];
    return family?.husbandXref === this.individualXref()
      ? family.wifeXref
      : (family?.husbandXref ?? "");
  }

  // A new family with this individual as husband or wife (by sex).
  addSpouseFamily() {
    const familyXref = calculateNextFamilyXref(this.workingDatabase());
    this.edit((draft) => {
      const individual = draft.individuals[this.individualXref()];
      if (!individual) return;
      const isWife = individual.sex.sex === "F";
      draft.families[familyXref] = newGedcomFamily({
        xref: familyXref,
        husbandXref: isWife ? "" : individual.xref,
        wifeXref: isWife ? individual.xref : "",
      });
      individual.parentOfFamilyXrefs.push(familyXref);
    });
  }

  // Takes this individual out of the family, as a spouse or a child.
  removeFromFamily(familyXref: string) {
    this.edit((draft) => {
      unlink(draft, familyXref, this.individualXref());
    });
  }

  changeSpouse(familyXref: string, spouseXref: string) {
    if (spouseXref === this.individualXref()) return;
    this.edit((draft) => {
      const family = draft.families[familyXref];
      if (!family) return;
      const field =
        family.husbandXref === this.individualXref()
          ? "wifeXref"
          : "husbandXref";
      const oldSpouse = this.editableIndividual(draft, family[field]);
      if (oldSpouse) {
        oldSpouse.parentOfFamilyXrefs = oldSpouse.parentOfFamilyXrefs.filter(
          (xref) => xref !== familyXref,
        );
      }
      family[field] = spouseXref;
      this.editableIndividual(draft, spouseXref)?.parentOfFamilyXrefs.push(
        familyXref,
      );
    });
  }

  addChild(familyXref: string, childXref: string) {
    this.addingChildTo.set(undefined);
    if (!childXref) return;
    this.edit((draft) => {
      const family = draft.families[familyXref];
      const child = this.editableIndividual(draft, childXref);
      if (!family || !child || family.childXrefs.includes(childXref)) return;
      family.childXrefs.push(childXref);
      child.childOfFamilyXrefs.push(familyXref);
    });
  }

  removeChild(familyXref: string, childXref: string) {
    this.edit((draft) => {
      this.editableIndividual(draft, childXref);
      unlink(draft, familyXref, childXref);
    });
  }

  private edit(recipe: (draft: Draft<GedcomDatabase>) => void) {
    this.value.update((database) => produce(database, recipe));
  }

  // The value only holds the records open in the editor. An individual who
  // isn't open (e.g. a spouse or child picked from the list) is copied in
  // from the whole database, so their side of the link can be updated too.
  private editableIndividual(
    draft: Draft<GedcomDatabase>,
    xref: string,
  ): Draft<GedcomIndividual> | undefined {
    const individual = this.workingDatabase().individuals[xref];
    if (!draft.individuals[xref] && individual) {
      draft.individuals[xref] = {
        ...individual,
        childOfFamilyXrefs: [...individual.childOfFamilyXrefs],
        parentOfFamilyXrefs: [...individual.parentOfFamilyXrefs],
      };
    }
    return draft.individuals[xref];
  }
}

// Removes the links, both ways, between a family and one of its members.
function unlink(
  draft: Draft<GedcomDatabase>,
  familyXref: string,
  individualXref: string,
) {
  const family = draft.families[familyXref];
  if (family) {
    if (family.husbandXref === individualXref) family.husbandXref = "";
    if (family.wifeXref === individualXref) family.wifeXref = "";
    family.childXrefs = family.childXrefs.filter(
      (xref) => xref !== individualXref,
    );
  }
  const individual = draft.individuals[individualXref];
  if (individual) {
    individual.parentOfFamilyXrefs = individual.parentOfFamilyXrefs.filter(
      (xref) => xref !== familyXref,
    );
    individual.childOfFamilyXrefs = individual.childOfFamilyXrefs.filter(
      (xref) => xref !== familyXref,
    );
  }
}
