import { Component, computed, input, model, signal } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomExternalIdentifier,
  type GedcomExternalIdentifier,
} from "../../gedcom/gedcomExternalIdentifier";
import {
  externalIdentifierFromUrl,
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

  /** What's typed or pasted in the "add from a link" field; cleared once
   * it's read as a FamilySearch or Ancestry person page. */
  readonly pastedUrl = signal("");

  /** Adds the EXID for a pasted FamilySearch or Ancestry person page URL,
   * so the TYPE never has to be typed by hand. */
  addFromUrl(text: string) {
    this.pastedUrl.set(text);
    const externalIdentifier = externalIdentifierFromUrl(text);
    if (externalIdentifier === undefined) return;
    this.value.update((externalIdentifiers) => [
      ...externalIdentifiers,
      externalIdentifier,
    ]);
    this.pastedUrl.set("");
  }

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
