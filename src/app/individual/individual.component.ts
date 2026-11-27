import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { fullname, type GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { externalIdentifierLink } from "../../util/external-identifier-link";
import { describeRelationship } from "../../util/relationship";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-individual",
  imports: [GedcomEditorDialogComponent, RouterModule],
  templateUrl: "./individual.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualComponent implements ComponentWithUnsavedChanges {
  readonly individual = input.required<GedcomIndividual>();
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = this.individual();
    const rootXref = this.gedcom().rootIndividualXref;
    const root =
      rootXref === undefined
        ? undefined
        : ancestryDatabase.individuals[rootXref];
    return {
      individual,
      name: fullname(individual),
      root:
        root === undefined
          ? undefined
          : {
              xref: root.xref,
              name: fullname(root) || root.xref,
              relationship: capitalize(
                describeRelationship(
                  ancestryDatabase,
                  root.xref,
                  individual.xref,
                ),
              ),
            },
      sex: individual.sex.sex || "Unknown",
      externalIdentifiers: individual.externalIdentifiers.map(
        (externalIdentifier) => ({
          ...externalIdentifier,
          link: externalIdentifierLink(externalIdentifier),
        }),
      ),
    };
  });
}

function capitalize(text: string | undefined): string | undefined {
  return text === undefined
    ? undefined
    : text.charAt(0).toUpperCase() + text.slice(1);
}
