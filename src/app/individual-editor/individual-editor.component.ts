import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
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
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly xref = input<string>();
  readonly finished = output();

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

  private readonly computedDatabase = computed<AncestryDatabase | undefined>(
    () => {
      const ancestryDatabase = this.ancestryService.contents();
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
    },
  );

  private readonly records = computed(() => {
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

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryService.contents();
    if (ancestryDatabase == undefined) {
      return undefined;
    }
    const computedDatabase = this.computedDatabase();
    if (computedDatabase == undefined) {
      return undefined;
    }

    return {
      ancestryDatabase,
      computedDatabase,
      records: this.records(),
    };
  });

  async submitForm() {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      throw new Error("ancestry is undefined");
    }
    const gedcomFileHandle = ancestry.gedcomFileHandle;
    const gedcomText = this.records()
      .map(({ currentRecord }) => currentRecord)
      .filter((record) => record != undefined)
      .flatMap((record) => serializeGedcomRecordToText(record))
      .join("\n");

    const writableStream = await gedcomFileHandle.createWritable();
    await writableStream.write(gedcomText);
    await writableStream.close();
    this.ancestryService.gedcomResource.reload();

    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
