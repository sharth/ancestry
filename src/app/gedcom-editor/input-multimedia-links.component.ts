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
  type GedcomMultimediaCrop,
  type GedcomMultimediaLink,
} from "../../gedcom/gedcomMultimediaLink";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputMultimediaCropComponent } from "./input-multimedia-crop.component";

@Component({
  selector: "app-input-multimedia-links",
  templateUrl: "./input-multimedia-links.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, FormField, InputMultimediaCropComponent],
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

  filePathFor(xref: string): string | undefined {
    return this.workingDatabase().multimedias[xref]?.filePath;
  }

  isImage(xref: string): boolean {
    const mediaType = this.workingDatabase().multimedias[xref]?.mediaType;
    return mediaType?.startsWith("image/") ?? false;
  }

  setCrop(index: number, crop: GedcomMultimediaCrop | undefined) {
    this.value.update((multimediaLinks) =>
      multimediaLinks.map((link, i) =>
        i === index ? { ...link, crop } : link,
      ),
    );
  }

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
