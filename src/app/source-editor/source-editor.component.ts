import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputSourceComponent } from "../../forms/input-source.component";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomRepository } from "../../gedcom/gedcomRepository";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import type { GedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import type { OnInit } from "@angular/core";
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor",
  templateUrl: "./source-editor.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    InputSourceComponent,
    GedcomDiffComponent,
  ],
})
export class SourceEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

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
