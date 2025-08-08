import type { ElementRef } from "@angular/core";
import { Component, computed, inject, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../../util/gedcom-diff.component";
import { AncestryService } from "../../database/ancestry.service";
import { SourceCitationsComponent } from "./source-citations.component";
import { SourceRepositoriesComponent } from "./source-repositories.component";
import { SourceMultimediaComponent } from "./source-multimedia.component";
import { SourceEditorComponent } from "../source-editor/source-editor.component";
import { SourceUnknownsComponent } from "./source-unknowns.component";

@Component({
  selector: "app-source",
  templateUrl: "./source.component.html",
  styleUrl: "./source.component.css",
  imports: [
    CommonModule,
    RouterModule,
    GedcomDiffComponent,
    SourceCitationsComponent,
    SourceRepositoriesComponent,
    SourceMultimediaComponent,
    SourceEditorComponent,
    SourceUnknownsComponent,
  ],
})
export class SourceComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources.get(this.xref());
    if (source == undefined) {
      return undefined;
    }

    return {
      source,
      oldGedcomRecord: ancestry.originalRecords.find(
        (r) => r.tag == "SOUR" && r.xref == source.xref
      ),
      newGedcomRecord: serializeGedcomSource(source),
    };
  });

  readonly editDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("editDialog");

  openSourceEditor() {
    this.editDialog().nativeElement.showModal();
  }

  closeSourceEditor() {
    this.editDialog().nativeElement.close();
  }
}
