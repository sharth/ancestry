import { Component, inject, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import { produce } from "immer";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { calculateNextFamilyXref } from "../../util/next-xref";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import {
  InputFamilyComponent,
  setFamilyMembers,
} from "./input-family.component";

// The families an individual is part of, as a child or as a spouse. Each
// spouse family is edited here with the family editor (its spouses,
// children and events, e.g. the marriage). The value is the whole database,
// like the family editor's, since adding or leaving a family changes the
// family and its members together.
@Component({
  selector: "app-input-individual-families",
  imports: [FormField, InputFamilyComponent],
  templateUrl: "./input-individual-families.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFamiliesComponent implements FormValueControl<GedcomDatabase> {
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly individualXref = input.required<string>();
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);

  individual(): GedcomIndividual | undefined {
    return this.value().individuals[this.individualXref()];
  }

  childOfFamilyLabel(familyXref: string): string {
    const family = this.value().families[familyXref];
    const parents = [family?.husbandXref, family?.wifeXref]
      .map((xref) => this.individualLabel(xref ?? ""))
      .filter((label) => label !== "");
    return `Child of: ${parents.join(" & ") || "Unknown"} (${familyXref})`;
  }

  parentOfFamilyLabel(familyXref: string): string {
    const spouse = this.individualLabel(this.spouseOf(familyXref));
    return `Spouse in: ${spouse || "Unknown"} (${familyXref})`;
  }

  private individualLabel(xref: string): string {
    const name = this.value().individuals[xref]?.names.at(0);
    return (name ? displayGedcomName(name) : "") || xref;
  }

  private spouseOf(familyXref: string): string {
    const family = this.value().families[familyXref];
    return family?.husbandXref === this.individualXref()
      ? family.wifeXref
      : (family?.husbandXref ?? "");
  }

  // A new family with this individual as husband or wife (by sex).
  addSpouseFamily() {
    const familyXref = calculateNextFamilyXref(this.value());
    const individualXref = this.individualXref();
    const isWife = this.individual()?.sex.sex === "F";
    this.value.update(
      produce((draft) => {
        draft.families[familyXref] = newGedcomFamily({ xref: familyXref });
        setFamilyMembers(
          draft,
          familyXref,
          isWife
            ? { wifeXref: individualXref }
            : { husbandXref: individualXref },
        );
      }),
    );
  }

  // Takes this individual out of the family, as a spouse or a child.
  removeFromFamily(familyXref: string) {
    const individualXref = this.individualXref();
    this.value.update(
      produce((draft) => {
        const family = draft.families[familyXref];
        if (!family) return;
        setFamilyMembers(draft, familyXref, {
          husbandXref:
            family.husbandXref === individualXref ? "" : family.husbandXref,
          wifeXref: family.wifeXref === individualXref ? "" : family.wifeXref,
          childXrefs: family.childXrefs.filter(
            (xref) => xref !== individualXref,
          ),
        });
      }),
    );
  }
}
