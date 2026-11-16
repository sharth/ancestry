import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  linkedSignal,
  untracked,
  viewChild,
  type ElementRef,
} from "@angular/core";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import { GedcomEditorComponent } from "../gedcom-editor/gedcom-editor.component";

@Component({
  selector: "app-gedcom-editor-dialog",
  imports: [GedcomEditorComponent],
  templateUrl: "./gedcom-editor-dialog.component.html",
  styleUrl: "./gedcom-editor-dialog.component.css",
  host: {
    "(window:beforeunload)": "onBeforeUnload($event)",
  },
})
export class GedcomEditorDialogComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ancestryService = inject(AncestryService);

  readonly tabs = input.required<TabInformation[]>();
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  // What the editor edits. It follows `ancestryDatabase()` (e.g. when
  // another tab saves and this tab reloads the file) except while the user
  // has unsaved edits open: then it stays put, so the reload doesn't wipe
  // them, and saving them is refused (the file changed underneath them)
  // rather than writing over the other tab's changes.
  readonly editorDatabase = linkedSignal<GedcomDatabase, GedcomDatabase>({
    source: this.ancestryDatabase,
    computation: (latest, previous) =>
      previous !== undefined && untracked(() => this.hasUnsavedChanges())
        ? previous.value
        : latest,
  });

  readonly editDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("editDialog");
  readonly gedcomEditor = viewChild(GedcomEditorComponent);

  async showModal() {
    // Settings only ever requests read access; upgrade to write access now
    // that the user is actually about to edit, prompting them if needed.
    await this.ancestryService.requestWritePermission();
    this.editDialog().nativeElement.showModal();
    this.cdr.detectChanges();
  }

  close() {
    this.editDialog().nativeElement.close();
    this.cdr.detectChanges();
  }

  hasUnsavedChanges(): boolean {
    return (
      this.editDialog().nativeElement.open &&
      (this.gedcomEditor()?.hasUnsavedChanges() ?? false)
    );
  }

  onDialogCancel(event: Event) {
    if (
      this.hasUnsavedChanges() &&
      !confirm("You have unsaved changes. Close without saving?")
    ) {
      event.preventDefault();
    }
  }

  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }
}
