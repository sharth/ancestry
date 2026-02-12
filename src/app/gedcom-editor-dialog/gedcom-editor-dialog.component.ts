import { GedcomEditorComponent } from "../gedcom-editor/gedcom-editor.component";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  viewChild,
} from "@angular/core";
import type { ElementRef } from "@angular/core";

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
  readonly type = input.required<"INDI" | "SOUR" | "OBJE">();

  readonly editDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("editDialog");

  showModal() {
    this.editDialog().nativeElement.showModal();
    this.cdr.detectChanges();
  }
}
