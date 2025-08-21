import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import {
  type GedcomRecord,
  serializeGedcomRecordToText,
} from "../../gedcom/gedcomRecord";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { serializeGedcomSubmitter } from "../../gedcom/gedcomSubmitter";
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

  readonly xref = input<string>();
  readonly finished = output();

  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly form = this.formBuilder.control<GedcomIndividual | undefined>(
    undefined,
  );
  readonly formSignal = toSignal(this.form.valueChanges);

  ngOnInit() {
    const ancestry = this.ancestryService.contents();
    const xref = this.xref() ?? "";
    const individual = ancestry?.individuals.get(xref);
    this.form.setValue(individual);
  }

  readonly records = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == null) {
      return [];
    }

    const recordMap = new Map<
      string,
      { oldRecord?: GedcomRecord; currentRecord?: GedcomRecord }
    >();
    const hash = (gedcomRecord: GedcomRecord) =>
      `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;

    for (const gedcomRecord of ancestry.gedcomRecords) {
      recordMap.set(hash(gedcomRecord), { oldRecord: gedcomRecord });
    }

    const includeInRecordMap = (gedcomRecord: GedcomRecord) => {
      const h = hash(gedcomRecord);
      const r = recordMap.get(h);
      if (r === undefined) {
        recordMap.set(h, { currentRecord: gedcomRecord });
      } else {
        r.currentRecord = gedcomRecord;
      }
    };

    includeInRecordMap({ tag: "HEAD", abstag: "HEAD", children: [] });
    ancestry.submitters
      .values()
      .map(serializeGedcomSubmitter)
      .forEach(includeInRecordMap);
    ancestry.individuals
      .values()
      .map(serializeGedcomIndividual)
      .forEach(includeInRecordMap);
    ancestry.families
      .values()
      .map(serializeGedcomFamily)
      .forEach(includeInRecordMap);
    ancestry.sources
      .values()
      .map(serializeGedcomSource)
      .forEach(includeInRecordMap);
    ancestry.repositories
      .values()
      .map(serializeGedcomRepository)
      .forEach(includeInRecordMap);
    ancestry.multimedias
      .values()
      .map(serializeGedcomMultimedia)
      .forEach(includeInRecordMap);
    const individual = this.formSignal();
    if (individual != null) {
      includeInRecordMap(serializeGedcomIndividual(individual));
    }
    includeInRecordMap({ tag: "TRLR", abstag: "TRLR", children: [] });

    return recordMap
      .entries()
      .map(([hash, { oldRecord, currentRecord }]) => ({
        hash,
        oldRecord,
        currentRecord,
        equivalent:
          oldRecord != undefined &&
          currentRecord != undefined &&
          serializeGedcomRecordToText(oldRecord).join("\n") ==
            serializeGedcomRecordToText(currentRecord).join("\n"),
      }))
      .toArray();
  });

  submitForm() {
    // const vm = this.vm();
    // if (vm == null) return;
    // await this.ancestryDatabase.transaction(
    //   "rw",
    //   [this.ancestryDatabase.individuals],
    //   async () => {
    //     const xref = this.xref() ?? (await this.nextXref());
    //     await this.ancestryDatabase.individuals.put({ ...vm, xref });
    //   }
    // );

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
