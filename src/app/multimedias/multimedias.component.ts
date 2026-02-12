import type { AncestryDatabase } from "../../database/ancestry.service";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-multimedias",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./multimedias.component.html",
  styleUrl: "./multimedias.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultimediasComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      multimedias: Object.values(ancestryDatabase.multimedias),
    };
  });
}
