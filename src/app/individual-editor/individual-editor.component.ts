import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import type { OnInit } from "@angular/core";
import { Component, computed, inject, input, output } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: "app-individual-editor",
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputIndividualComponent,
    GedcomDiffComponent,
  ],
  templateUrl: "./individual-editor.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorComponent implements OnInit {
  private readonly ancestryService = inject(AncestryService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly xref = input<string>();
  readonly finished = output();

  readonly form = this.formBuilder.control<GedcomIndividual | undefined>(
    undefined,
  );
  readonly formSignal = toSignal(this.form.valueChanges);

  ngOnInit() {
    const ancestry = this.ancestryService.ancestryDatabase();
    const xref = this.xref() ?? "";
    const individual = ancestry?.individuals.get(xref);
    this.form.setValue(individual);
  }

  private readonly computedDatabase = computed(() => {
    const ancestryDatabase = this.ancestryService.ancestryDatabase();
    if (ancestryDatabase == null) {
      return undefined;
    }

    const computedIndividual = this.formSignal();
    if (computedIndividual == undefined) {
      return undefined;
    }

    const individuals = new Map(ancestryDatabase.individuals);
    individuals.set(computedIndividual.xref, computedIndividual);

    return {
      individuals,
      families: ancestryDatabase.families,
      sources: ancestryDatabase.sources,
      repositories: ancestryDatabase.repositories,
      multimedias: ancestryDatabase.multimedias,
      submitters: ancestryDatabase.submitters,
    };
  });

  readonly vm = computed(() => {
    const computedDatabase = this.computedDatabase();
    if (computedDatabase == undefined) {
      return undefined;
    }

    return {
      computedDatabase,
      differences: this.ancestryService
        .compareGedcomDatabase(computedDatabase)
        .filter(
          ({ canonicalRecord, currentRecord }) =>
            canonicalRecord !== undefined &&
            currentRecord !== undefined &&
            serializeGedcomRecordToText(canonicalRecord).join("\n") !==
              serializeGedcomRecordToText(currentRecord).join("\n"),
        ),
    };
  });

  async submitForm() {
    const computedDatabase = this.computedDatabase();
    if (computedDatabase == undefined) {
      throw new Error("computedDatabase is undefined");
    }
    await this.ancestryService.updateGedcomDatabase(computedDatabase);
    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
