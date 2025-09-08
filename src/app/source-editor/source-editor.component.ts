import { AncestryService } from "../../database/ancestry.service";
import { InputSourceComponent } from "../../forms/input-source.component";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import type { OnInit } from "@angular/core";
import { Component, computed, inject, input, output } from "@angular/core";
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
export class SourceEditorComponent implements OnInit {
  private readonly ancestryService = inject(AncestryService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly xref = input<string>();
  readonly finished = output();

  readonly form = this.formBuilder.control<GedcomSource | undefined>(undefined);
  readonly formSignal = toSignal(this.form.valueChanges);

  ngOnInit() {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return;
    }
    const xref = this.xref();
    if (xref == undefined) {
      this.form.setValue({
        xref: this.ancestryService.nextSourceXref(),
        repositoryCitations: [],
        unknownRecords: [],
        multimediaLinks: [],
      });
    } else {
      this.form.setValue(ancestry.sources.get(xref));
    }
  }

  private readonly computedDatabase = computed(() => {
    const ancestryDatabase = this.ancestryService.ancestryDatabase();
    if (ancestryDatabase == null) {
      return undefined;
    }

    const computedSource = this.formSignal();
    if (computedSource == undefined) {
      return undefined;
    }

    const sources = new Map(ancestryDatabase.sources);
    sources.set(computedSource.xref, computedSource);

    return {
      individuals: ancestryDatabase.individuals,
      families: ancestryDatabase.families,
      sources,
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
            canonicalRecord == undefined ||
            currentRecord == undefined ||
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
