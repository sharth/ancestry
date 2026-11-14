import { Component, computed, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomExternalIdentifier,
  type GedcomExternalIdentifier,
} from "../../gedcom/gedcomExternalIdentifier";
import {
  externalIdentifierLink,
  familySearchPersonIdType,
} from "../../util/external-identifier-link";

@Component({
  selector: "app-input-external-identifiers",
  imports: [FormField],
  templateUrl: "./input-external-identifiers.component.html",
  styleUrl: "./input.component.css",
})
export class InputExternalIdentifiersComponent implements FormValueControl<
  GedcomExternalIdentifier[]
> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomExternalIdentifier[]>([]);
  readonly form = form(this.value);

  /** Types offered in the TYPE field: FamilySearch, plus every type already
   * used in the database (e.g. each Ancestry tree). */
  readonly knownTypes = computed(() => {
    const types = new Set([familySearchPersonIdType]);
    for (const individual of Object.values(
      this.workingDatabase().individuals,
    )) {
      for (const externalIdentifier of individual.externalIdentifiers) {
        if (externalIdentifier.type) types.add(externalIdentifier.type);
      }
    }
    return [...types];
  });

  readonly links = computed(() =>
    this.value().map((externalIdentifier) =>
      externalIdentifierLink(externalIdentifier),
    ),
  );

  appendExternalIdentifier(type = "") {
    this.value.update((externalIdentifiers) => [
      ...externalIdentifiers,
      newGedcomExternalIdentifier({ type }),
    ]);
  }

  appendFamilySearchPersonId() {
    this.appendExternalIdentifier(familySearchPersonIdType);
  }

  removeExternalIdentifier(index: number) {
    this.value.update((externalIdentifiers) =>
      externalIdentifiers.toSpliced(index, 1),
    );
  }
}
