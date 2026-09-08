import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDisplayComponent } from "../gedcom-display/gedcom-display.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { SourceCitationsComponent } from "./source-citations.component";
import { SourceMultimediaComponent } from "./source-multimedia.component";
import { SourceRepositoriesComponent } from "./source-repositories.component";
import { SourceUnknownsComponent } from "./source-unknowns.component";

@Component({
  selector: "app-source",
  templateUrl: "./source.component.html",
  styleUrl: "./source.component.css",
  imports: [
    RouterModule,
    SourceCitationsComponent,
    SourceRepositoriesComponent,
    SourceMultimediaComponent,
    GedcomEditorDialogComponent,
    SourceUnknownsComponent,
    GedcomDisplayComponent,
  ],
})
export class SourceComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const source = ancestryDatabase.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return {
      source,
      gedcomRecord: serializeGedcomSource(source),
    };
  });
}
