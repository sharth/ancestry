import { Component, computed, inject, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { multimediaFiles } from "../../util/multimedia-files";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { MultimediaCitationsComponent } from "./multimedia-citations.component";
import { MultimediaPreviewComponent } from "./multimedia-preview.component";
import { MultimediaSourcesComponent } from "./multimedia-sources.component";

@Component({
  selector: "app-multimedia",
  imports: [
    RouterModule,
    GedcomEditorDialogComponent,
    MultimediaPreviewComponent,
    MultimediaCitationsComponent,
    MultimediaSourcesComponent,
    GedcomDisplayComponent,
  ],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
})
export class MultimediaComponent implements ComponentWithUnsavedChanges {
  readonly ancestryService = inject(AncestryService);
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly files = multimediaFiles();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const multimedia = ancestryDatabase.multimedias[this.xref()];
    if (multimedia === undefined) {
      return undefined;
    }

    return {
      multimedia,
      gedcomRecord: serializeGedcomMultimedia(multimedia),
    };
  });
}
