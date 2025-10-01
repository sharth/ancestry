import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { GedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";

@Component({
  selector: "app-individual-editor",
  imports: [InputIndividualComponent, GedcomDiffComponent],
  templateUrl: "./individual-editor.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly xref = input<string>();
  readonly finished = output();

  readonly computedDatabase = signal<AncestryDatabase>(
    this.ancestryService.ancestryDatabase() ?? {
      individuals: new Map<string, GedcomIndividual>(),
      families: new Map<string, GedcomFamily>(),
      sources: new Map<string, GedcomSource>(),
      multimedias: new Map<string, GedcomMultimedia>(),
      submitters: new Map<string, GedcomSubmitter>(),
      repositories: new Map<string, GedcomRepository>(),
    },
  );

  readonly differences = computed(() =>
    this.ancestryService
      .compareGedcomDatabase(this.computedDatabase())
      .filter(
        ({ canonicalRecord, currentRecord }) =>
          canonicalRecord == undefined ||
          currentRecord == undefined ||
          serializeGedcomRecordToText(canonicalRecord).join("\n") !==
            serializeGedcomRecordToText(currentRecord).join("\n"),
      ),
  );

  async submitForm() {
    const computedDatabase = this.computedDatabase();
    await this.ancestryService.updateGedcomDatabase(computedDatabase);
    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
