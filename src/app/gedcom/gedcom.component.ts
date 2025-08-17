import { AncestryService } from "../../database/ancestry.service";
import { monthNames } from "../../gedcom/gedcomDate";
import { serializeGedcomFamily } from "../../gedcom/gedcomFamily";
import { serializeGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { serializeGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import type { GedcomRecord } from "../../gedcom/gedcomRecord";
import {
  serializeGedcomRecordToText,
  sortRecordsByOtherRecords,
} from "../../gedcom/gedcomRecord";
import { serializeGedcomRepository } from "../../gedcom/gedcomRepository";
import { serializeGedcomSource } from "../../gedcom/gedcomSource";
import { serializeGedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { Component, computed, inject } from "@angular/core";

@Component({
  selector: "app-gedcom",
  imports: [GedcomDiffComponent],
  templateUrl: "./gedcom.component.html",
  styleUrl: "./gedcom.component.css",
})
export class GedcomComponent {
  private ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == null) return;

    const now = new Date();
    const day = now.getDate();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const originalRecords = ancestry.gedcomRecords;
    const computedRecords = sortRecordsByOtherRecords(
      [
        {
          tag: "HEAD",
          abstag: "HEAD",
          children: [
            {
              tag: "GEDC",
              abstag: "HEAD.GEDC",
              children: [
                {
                  tag: "VERS",
                  abstag: "HEAD.GEDC.VERS",
                  value: "7.0.14",
                  children: [],
                },
              ],
            },
            {
              tag: "SOUR",
              abstag: "HEAD.SOUR",
              value: "https://github.com/sharth/ancestry",
              children: [],
            },
            {
              tag: "DATE",
              abstag: "HEAD.DATE",
              value: `${day} ${month} ${year}`,
              children: [],
            },
          ],
        },
        ...[...ancestry.submitters.values()].map(serializeGedcomSubmitter),
        ...[...ancestry.individuals.values()].map(serializeGedcomIndividual),
        ...[...ancestry.families.values()].map(serializeGedcomFamily),
        ...[...ancestry.sources.values()].map(serializeGedcomSource),
        ...[...ancestry.repositories.values()].map(serializeGedcomRepository),
        ...[...ancestry.multimedias.values()].map(serializeGedcomMultimedia),
        { tag: "TRLR", abstag: "TRLR", children: [] },
      ],
      originalRecords,
    );

    const deltas = new Map<
      string,
      { originalRecord?: GedcomRecord; currentRecord?: GedcomRecord }
    >();

    for (const gedcomRecord of originalRecords) {
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

    for (const gedcomRecord of computedRecords) {
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
        .filter(
          ({ originalRecord, currentRecord }) =>
            originalRecord === undefined ||
            currentRecord === undefined ||
            serializeGedcomRecordToText(originalRecord).join("\n") !=
              serializeGedcomRecordToText(currentRecord).join("\n"),
        )
        .toArray(),
    };
  });
}
