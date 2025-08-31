import { AncestryService } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { SourceEditorComponent } from "../source-editor/source-editor.component";
import { SourceCitationsComponent } from "./source-citations.component";
import { SourceMultimediaComponent } from "./source-multimedia.component";
import { SourceRepositoriesComponent } from "./source-repositories.component";
import { SourceUnknownsComponent } from "./source-unknowns.component";
import type { ElementRef } from "@angular/core";
import { Component, computed, inject, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source",
  templateUrl: "./source.component.html",
  styleUrl: "./source.component.css",
  imports: [
    RouterModule,
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
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources.get(this.xref());
    if (source == undefined) {
      return undefined;
    }

    return {
      source,
      newGedcomRecord: serializeGedcomSource(source),
      newGedcomText: serializeGedcomRecordToText(serializeGedcomSource(source)),
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
