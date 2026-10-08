import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
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
})
export class GedcomEditorDialogComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ancestryService = inject(AncestryService);

  readonly xref = input<string>();
  readonly type = input.required<"INDI" | "SOUR" | "OBJE" | "REPO">();
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly additionalTabs = input<TabInformation[]>([]);

  readonly editDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("editDialog");

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
}
