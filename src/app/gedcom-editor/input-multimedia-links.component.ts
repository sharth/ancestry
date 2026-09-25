import {
  Component,
  Injector,
  ViewChildren,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  type ElementRef,
  type QueryList,
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
  newGedcomMultimediaLink,
  type GedcomMultimediaLink,
} from "../../gedcom/gedcomMultimediaLink";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";

@Component({
  selector: "app-input-multimedia-links",
  templateUrl: "./input-multimedia-links.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, FormField],
})
export class InputMultimediaLinksComponent implements FormValueControl<
  GedcomMultimediaLink[]
> {
  private readonly _injector = inject(Injector);
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomMultimediaLink[]>([]);
  readonly form = form(this.value);

  readonly multimedias = computed(() =>
    Object.values(this.workingDatabase().multimedias),
  );

  // Keep track of the controls that were added by a user interaction.
  readonly newControls = new WeakSet<FieldTree<GedcomMultimediaLink, number>>();

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendMultimediaLink() {
    this.value.update((multimediaLinks) => [
      ...multimediaLinks,
      newGedcomMultimediaLink(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.newControls.add(this.form[this.form.length - 1]!);
    afterNextRender(
      {
        read: () => {
          this.focusTargets.last.nativeElement.focus();
        },
      },
      { injector: this._injector },
    );
  }

  removeMultimediaLink(index: number) {
    this.value.update((multimediaLinks) => multimediaLinks.toSpliced(index, 1));
  }

  createNewMultimedia(linkIndex: number) {
    if (this.gedcomEditor) {
      const xref = this.gedcomEditor.openNewMultimedia();
      this.form[linkIndex]?.xref().value.set(xref);
    }
  }

  openMultimediaInSession(xref: string) {
    if (this.gedcomEditor) {
      this.gedcomEditor.openMultimedia(xref);
    }
  }
}
