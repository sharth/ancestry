import {
  Component,
  Injector,
  afterNextRender,
  inject,
  input,
  model,
} from "@angular/core";
import {
  FormField,
  form,
  type FieldTree,
  type FormValueControl,
} from "@angular/forms/signals";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomRepositoryLink,
  type GedcomRepositoryLink,
} from "../../gedcom/gedcomRepositoryLink";
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
})
export class InputRepositoryLinksComponent implements FormValueControl<
  GedcomRepositoryLink[]
> {
  private readonly _injector = inject(Injector);

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomRepositoryLink[]>([]);
  readonly form = form(this.value);

  // Keep track of the controls that were added by a user interaction.
  readonly newControls = new WeakSet<FieldTree<GedcomRepositoryLink, number>>(
    [],
  );

  appendCitation() {
    this.value.update((repositoryLinks) => [
      ...repositoryLinks,
      newGedcomRepositoryLink(),
    ]);
    const newControl = this.form[this.form.length - 1]!;
    this.newControls.add(newControl);
    afterNextRender(
      {
        read: () => {
          newControl().focusBoundControl();
        },
      },
      { injector: this._injector },
    );
  }

  removeCitation(index: number) {
    this.value.update((repositoryLinks) => repositoryLinks.toSpliced(index, 1));
  }
}
