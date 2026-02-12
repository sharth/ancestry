import type { AncestryDatabase } from "../../database/ancestry.service";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-multimedia",
  imports: [RouterModule, GedcomEditorDialogComponent],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultimediaComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const multimedia = ancestryDatabase.multimedias[this.xref()];
    if (multimedia === undefined) {
      return undefined;
    }

    return { multimedia };
  });
}
