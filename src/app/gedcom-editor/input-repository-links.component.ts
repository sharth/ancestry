import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewChildren,
  afterNextRender,
  inject,
  input,
  model,
  type QueryList,
} from "@angular/core";
import {
  FormField,
  form,
  type FieldTree,
  type FormValueControl,
} from "@angular/forms/signals";
import { RouterModule } from "@angular/router";
import type { AncestryDatabase } from "../../database/ancestry.service";
import type { GedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { InputRepositoryCallNumberComponent } from "./input-repository-call-number.component";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";

@Component({
  selector: "app-input-repository-links",
  templateUrl: "./input-repository-links.component.html",
  styleUrl: "./input.component.css",
  imports: [
    FormField,
    RouterModule,
    InputRepositoryCallNumberComponent,
    InputRepositoryXrefComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRepositoryLinksComponent implements FormValueControl<
  GedcomRepositoryLink[]
> {
  private readonly _injector = inject(Injector);

  readonly ancestryDatabase = input.required<AncestryDatabase>();
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
    this.newControls.add(this.form[this.form.length - 1]!);
    afterNextRender(
      {
        read: () => {
          this.focusTargets.last.focus();
        },
      },
      { injector: this._injector },
    );
  }

  removeCitation(index: number) {
    this.value.update((repositoryLinks) => repositoryLinks.toSpliced(index, 1));
  }
}
