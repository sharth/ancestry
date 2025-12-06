import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomRepositoryLink } from "../gedcom/gedcomRepositoryLink";
import { InputRepositoryCallNumberComponent } from "./input-repository-call-number.component";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";
import type { QueryList } from "@angular/core";
import { Component, ViewChildren, model } from "@angular/core";
import type { FieldTree, FormValueControl } from "@angular/forms/signals";
import { Field, form } from "@angular/forms/signals";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-input-repository-links",
  templateUrl: "./input-repository-links.component.html",
  styleUrl: "./input.component.css",
  imports: [
    Field,
    RouterModule,
    InputRepositoryCallNumberComponent,
    InputRepositoryXrefComponent,
  ],
})
export class InputRepositoryLinksComponent implements FormValueControl<
  GedcomRepositoryLink[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomRepositoryLink[]>([]);
  readonly form = form(this.value);

  @ViewChildren("focusTarget")
  focusTargets!: QueryList<InputRepositoryXrefComponent>;

  // Keep track of the controls that were added by a user interation.
  readonly newControls = new WeakSet<FieldTree<GedcomRepositoryLink, number>>(
    [],
  );

  appendCitation() {
    this.value.update((repostitoryLinks) => [
      ...repostitoryLinks,
      { repositoryXref: "", callNumber: "" },
    ]);
    this.newControls.add(this.form[-1]!);
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeCitation(index: number) {
    this.value.update((repositoryLinks) => repositoryLinks.toSpliced(index, 1));
  }
}
