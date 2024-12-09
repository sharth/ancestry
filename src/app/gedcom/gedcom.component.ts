import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { GedcomDiffComponent } from "../../util/gedcom-diff.component";
import { GedcomRecord, serializeGedcomRecordToText } from "../../gedcom";
import {
  serializeGedcomIndividual,
  serializeGedcomFamily,
  serializeGedcomSource,
  serializeGedcomRepository,
  serializeGedcomSubmitter,
  serializeGedcomMultimedia,
  parseGedcomRecords,
} from "../../gedcom";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-gedcom",
  standalone: true,
  imports: [CommonModule, GedcomDiffComponent],
  templateUrl: "./gedcom.component.html",
  styleUrl: "./gedcom.component.css",
})
export class GedcomComponent {
  private ancestryService = inject(AncestryService);

  private readonly originalGedcomRecords = computed<GedcomRecord[]>(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry === undefined) {
      return [];
    }
    return parseGedcomRecords(ancestry.originalText);
  });

  readonly vmm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry === undefined) {
      return [];
    }
    // Copy the existing objects in the database, so that we can mutate them.
    const individuals = new Map(ancestry.individuals);

    // For each record in the original database, find the matching record in the current database.
    const deltas = [];
    for (const originalRecord of parseGedcomRecords(ancestry.originalText)) {
      if (originalRecord.tag == "INDI") {
        const xref = originalRecord.xref;
        if (xref == undefined) {
          deltas.push({ originalRecord, newRecord: undefined });
          continue;
        }
        const individual = individuals.get(xref);
        if (individual == undefined) {
          deltas.push({ originalRecord, newRecord: undefined });
          continue;
        }
        individuals.delete(xref);
        const newRecord = serializeGedcomIndividual(individual);
        deltas.push({ originalRecord, newRecord });
      } else {
        deltas.push({ originalRecord, newRecord: undefined });
      }
    }
    for (const individual of individuals.values()) {
      deltas.push({
        originalRecord: undefined,
        newRecord: serializeGedcomIndividual(individual),
      });
    }
    // For each record in originalGedcomRecords...
    // - Lookup the new object.
    // - Prepare a diff object for each one, passing the originalGedcomRecord, and newGedcomRecord
    // For each remaining record in newGedcomRecords
    // - Prepare a diff object for each one, passing undefined, and newGedcomRecord

    return {};
  });

  private readonly currentGedcomRecords = computed<GedcomRecord[]>(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry === undefined) {
      return [];
    }
    return [
      new GedcomRecord(undefined, "HEAD", "HEAD", undefined, []),
      ...[...ancestry.submitters.values()].map(serializeGedcomSubmitter),
      ...[...ancestry.individuals.values()].map(serializeGedcomIndividual),
      ...[...ancestry.families.values()].map(serializeGedcomFamily),
      ...[...ancestry.sources.values()].map(serializeGedcomSource),
      ...[...ancestry.repositories.values()].map(serializeGedcomRepository),
      ...[...ancestry.multimedia.values()].map(serializeGedcomMultimedia),
      new GedcomRecord(undefined, "TRLR", "TRLR", undefined, []),
    ];
  });

  private readonly orderedGedcomRecords = computed<GedcomRecord[]>(() => {
    const asKey = (record: GedcomRecord) =>
      `${record.tag} ${record.xref ?? ""} ${record.value ?? ""}`;
    const orderedRecords = new Map<string, GedcomRecord[]>();
    this.originalGedcomRecords()
      .filter((record) => record.abstag != "TRLR")
      .forEach((record) => {
        orderedRecords.set(asKey(record), []);
      });
    this.currentGedcomRecords().forEach((record) => {
      if (!orderedRecords.get(asKey(record))?.push(record))
        orderedRecords.set(asKey(record), [record]);
    });
    return Array.from(orderedRecords.values()).flat();
  });

  readonly vm = computed(() => ({
    oldGedcomText: this.originalGedcomRecords()
      .flatMap((record) => serializeGedcomRecordToText(record))
      .join("\n"),
    newGedcomText: this.orderedGedcomRecords()
      .flatMap((record) => serializeGedcomRecordToText(record))
      .join("\n"),
  }));
}
