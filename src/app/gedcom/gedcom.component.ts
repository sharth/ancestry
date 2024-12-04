import { CommonModule } from "@angular/common";
import { Component, computed, resource } from "@angular/core";
import { ancestryDatabase } from "../../database/ancestry.database";
import { GedcomDiffComponent } from "../../util/gedcom-diff.component";
import type { GedcomRecord } from "../../gedcom";
import {
  serializeGedcomHeader,
  serializeGedcomIndividual,
  serializeGedcomFamily,
  serializeGedcomSource,
  serializeGedcomRecordToText,
  serializeGedcomRepository,
  serializeGedcomTrailer,
  serializeGedcomSubmitter,
  serializeGedcomMultimedia,
  parseGedcomRecords,
} from "../../gedcom";

@Component({
  selector: "app-gedcom",
  standalone: true,
  imports: [CommonModule, GedcomDiffComponent],
  templateUrl: "./gedcom.component.html",
  styleUrl: "./gedcom.component.css",
})
export class GedcomComponent {
  private readonly database = resource({
    request: () => ({
      ancestryDatabaseIteration: ancestryDatabase.iteration(),
    }),
    loader: async ({ request }) => ({
      originalText: await ancestryDatabase.originalText.toArray(),
      headers: await ancestryDatabase.headers.toArray(),
      submitters: await ancestryDatabase.submitters.toArray(),
      individuals: await ancestryDatabase.individuals.toArray(),
      families: await ancestryDatabase.families.toArray(),
      sources: await ancestryDatabase.sources.toArray(),
      repositories: await ancestryDatabase.repositories.toArray(),
      multimedia: await ancestryDatabase.multimedia.toArray(),
      trailers: await ancestryDatabase.trailers.toArray(),
    }),
  });

  private readonly originalGedcomText = computed<string>(() => {
    const originalText = this.database.value()?.originalText;
    if (originalText == undefined) {
      return "";
    }
    return originalText.flatMap((row) => row.text).join("\n");
  });

  private readonly originalGedcomRecords = computed<GedcomRecord[]>(() =>
    parseGedcomRecords(this.originalGedcomText())
  );

  private readonly currentGedcomRecords = computed<GedcomRecord[]>(() => {
    const database = this.database.value();
    if (database === undefined) return [];
    return [
      ...database.headers.map(serializeGedcomHeader),
      ...database.submitters.map(serializeGedcomSubmitter),
      ...database.individuals.map(serializeGedcomIndividual),
      ...database.families.map(serializeGedcomFamily),
      ...database.sources.map(serializeGedcomSource),
      ...database.repositories.map(serializeGedcomRepository),
      ...database.multimedia.map(serializeGedcomMultimedia),
      ...database.trailers.map(serializeGedcomTrailer),
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

  private readonly orderedGedcomText = computed<string>(() => {
    return this.orderedGedcomRecords()
      .flatMap((record) => serializeGedcomRecordToText(record))
      .join("\n");
  });

  readonly vm = computed(() => ({
    oldGedcomText: this.originalGedcomText(),
    newGedcomText: this.orderedGedcomText(),
  }));
}
