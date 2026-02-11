import type { AncestryDatabase } from "../../database/ancestry.service";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomEditorComponent } from "../gedcom-editor/gedcom-editor.component";
import { SourceCitationsComponent } from "./source-citations.component";
import { SourceMultimediaComponent } from "./source-multimedia.component";
import { SourceRepositoriesComponent } from "./source-repositories.component";
import { SourceUnknownsComponent } from "./source-unknowns.component";
import type { ElementRef } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  viewChild,
} from "@angular/core";
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
    GedcomEditorComponent,
    SourceUnknownsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceComponent {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const source = ancestryDatabase.sources[this.xref()];
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
