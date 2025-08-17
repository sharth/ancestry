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
import type { OnInit } from "@angular/core";
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-individual-editor",
  imports: [FormsModule, ReactiveFormsModule, InputIndividualComponent],
  templateUrl: "./individual-editor.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorComponent implements OnInit {
  private readonly ancestryService = inject(AncestryService);

  readonly xref = input<string>();
  readonly finished = output();

  readonly individual = signal<GedcomIndividual | undefined>(undefined);
  readonly originalRecord = signal<GedcomRecord | undefined>(undefined);

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (window as any).individualEditor = this;
  }

  ngOnInit() {
    const ancestry = this.ancestryService.contents();
    const originalRecord = ancestry?.gedcomRecords.find(
      (record) => record.tag == "INDI" && record.xref == this.xref(),
    );
    this.originalRecord.set(originalRecord);

    const xref = this.xref() ?? "";
    const individual = ancestry?.individuals.get(xref);
    this.individual.set(individual);
  }

  // readonly computedRecord = computed<GedcomRecord | undefined>(() => {
  //   const individual = this.individual();
  //   return individual ? serializeGedcomIndividual(individual) : undefined;
  // });

  readonly originalText = computed<string[]>(() => {
    return this.ancestryService.contents()?.gedcomText?.split(`\r?\n`) ?? [];
  });

  readonly computedRecords = computed<GedcomRecord[]>(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == null) return [];

    const recordMap = new Map<string, GedcomRecord | null>();
    const hash = (gedcomRecord: GedcomRecord) =>
      `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
    const includeInRecordMap = (gedcomRecord: GedcomRecord) =>
      recordMap.set(hash(gedcomRecord), gedcomRecord);

    for (const gedcomRecord of ancestry.gedcomRecords) {
      recordMap.set(hash(gedcomRecord), null);
    }

    includeInRecordMap({ tag: "HEAD", abstag: "HEAD", children: [] });
    ancestry.submitters
      .values()
      .map(serializeGedcomSubmitter)
      .forEach(includeInRecordMap);
    ancestry.individuals
      .values()
      .filter((individual: GedcomIndividual) => individual.xref != this.xref())
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
    const individual = this.individual();
    if (individual != null) {
      includeInRecordMap(serializeGedcomIndividual(individual));
    }
    includeInRecordMap({ tag: "TRLR", abstag: "TRLR", children: [] });

    return recordMap
      .values()
      .filter((gedcomRecord: GedcomRecord | null) => gedcomRecord != null)
      .toArray();
  });

  readonly computedText = computed<string[]>(() => {
    return this.computedRecords().flatMap((gedcomRecord) =>
      serializeGedcomRecordToText(gedcomRecord),
    );
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
