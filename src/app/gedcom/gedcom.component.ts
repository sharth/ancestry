import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { GedcomDiffComponent } from "../../util/gedcom-diff.component";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import { AncestryService } from "../../database/ancestry.service";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import { serializeGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { serializeGedcomSubmitter } from "../../gedcom/gedcomSubmitter";

@Component({
  selector: "app-gedcom",
  standalone: true,
  imports: [CommonModule, GedcomDiffComponent],
  templateUrl: "./gedcom.component.html",
  styleUrl: "./gedcom.component.css",
})
export class GedcomComponent {
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == null) return;

    const deltas = new Map<
      string,
      { originalRecord?: GedcomRecord; currentRecord?: GedcomRecord }
    >();

    for (const gedcomRecord of ancestry.originalRecords) {
      const key = `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
      const delta = deltas.get(key);
      if (delta == null) {
        deltas.set(key, { originalRecord: gedcomRecord });
      } else if (delta.originalRecord) {
        throw new Error("slot already used");
      } else {
        delta.originalRecord = gedcomRecord;
      }
    }

    for (const gedcomRecord of [
      { tag: "HEAD", abstag: "HEAD", children: [] },
      ...[...ancestry.submitters.values()].map(serializeGedcomSubmitter),
      ...[...ancestry.individuals.values()].map(serializeGedcomIndividual),
      ...[...ancestry.families.values()].map(serializeGedcomFamily),
      ...[...ancestry.sources.values()].map(serializeGedcomSource),
      ...[...ancestry.repositories.values()].map(serializeGedcomRepository),
      ...[...ancestry.multimedia.values()].map(serializeGedcomMultimedia),
      { tag: "TRLR", abstag: "TRLR", children: [] },
    ]) {
      const key = `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
      const delta = deltas.get(key);
      if (delta == null) {
        deltas.set(key, { currentRecord: gedcomRecord });
      } else if (delta.currentRecord) {
        throw new Error("slot already used");
      } else {
        delta.currentRecord = gedcomRecord;
      }
    }

    return {
      differences: deltas
        .entries()
        .map(([key, { originalRecord, currentRecord }]) => ({
          key,
          originalRecord,
          currentRecord,
        }))
        .toArray(),
    };
  });
}
