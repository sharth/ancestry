import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  viewChild,
  type ElementRef,
} from "@angular/core";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { GedcomEditorComponent } from "../gedcom-editor/gedcom-editor.component";

@Component({
  selector: "app-gedcom-editor-dialog",
  imports: [GedcomEditorComponent],
  templateUrl: "./gedcom-editor-dialog.component.html",
  styleUrl: "./gedcom-editor-dialog.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GedcomEditorDialogComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly xref = input<string>();
  readonly type = input.required<"INDI" | "SOUR" | "OBJE" | "REPO">();
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly editDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("editDialog");

  showModal() {
    this.editDialog().nativeElement.showModal();
    this.cdr.detectChanges();
  }

  close() {
    this.editDialog().nativeElement.close();
    this.cdr.detectChanges();
  }
}
