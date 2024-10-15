import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ancestryDatabase } from "../../database/ancestry.database";
import * as dexie from "dexie";
import * as rxjs from "rxjs";
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
  serializeGedcomMultimedia,
  parseGedcomRecords,
} from "../../gedcom";
import { serializeGedcomSubmitter } from "../../gedcom/gedcomSubmitterSerializer";

@Component({
  selector: "app-gedcom",
  standalone: true,
  imports: [CommonModule, GedcomDiffComponent],
  templateUrl: "./gedcom.component.html",
  styleUrl: "./gedcom.component.css",
})
export class GedcomComponent {
  readonly vm$ = rxjs
    .combineLatest([this.oldGedcomText(), this.orderedNewGedcomText()])
    .pipe(
      rxjs.map(([oldGedcomText, newGedcomText]) => ({
        oldGedcomText: oldGedcomText.join("\n"),
        newGedcomText: newGedcomText.join("\n"),
      }))
    );

  oldGedcomText(): rxjs.Observable<string[]> {
    return rxjs
      .from(dexie.liveQuery(() => ancestryDatabase.originalText.toArray()))
      .pipe(
        rxjs.map((rows) => {
          console.log("compute oldGedcomText");
          if (rows.length == 0) {
            return [];
          } else if (rows.length == 1) {
            return rows[0].text.split(/\r?\n/);
          } else {
            throw new Error(
              "Unexpected number of rows in ancestryDatabase.originalText"
            );
          }
        })
      );
  }

  oldGedcomRecords(): rxjs.Observable<GedcomRecord[]> {
    return this.oldGedcomText().pipe(
      rxjs.map((oldGedcomText) => parseGedcomRecords(oldGedcomText.join("\n")))
    );
  }

  newGedcomRecords(): rxjs.Observable<GedcomRecord[]> {
    return rxjs
      .combineLatest([
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.headers.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomHeader))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.submitters.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomSubmitter))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.individuals.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomIndividual))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.families.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomFamily))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.sources.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomSource))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.repositories.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomRepository))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.multimedia.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomMultimedia))),
        rxjs
          .from(dexie.liveQuery(() => ancestryDatabase.trailers.toArray()))
          .pipe(rxjs.map((headers) => headers.map(serializeGedcomTrailer))),
      ])
      .pipe(rxjs.map((records: GedcomRecord[][]) => records.flat()));
  }

  // Current set of GedcomRecords, but organized similarly to the text that came in from the user.
  orderedNewGedcomRecords(): rxjs.Observable<GedcomRecord[]> {
    return rxjs
      .combineLatest([this.newGedcomRecords(), this.oldGedcomRecords()])
      .pipe(
        rxjs.map(([newGedcomRecords, oldGedcomRecords]) => {
          const orderedRecords = new Map<string, GedcomRecord[]>();
          oldGedcomRecords
            .filter((gedcomRecord) => gedcomRecord.abstag != "TRLR")
            .forEach((gedcomRecord) => {
              const order = `${gedcomRecord.tag} ${gedcomRecord.xref ?? ""} ${gedcomRecord.value ?? ""}`;
              orderedRecords.set(order, []);
            });
          newGedcomRecords.forEach((gedcomRecord) => {
            const order = `${gedcomRecord.tag} ${gedcomRecord.xref ?? ""} ${gedcomRecord.value ?? ""}`;
            if (!orderedRecords.get(order)?.push(gedcomRecord))
              orderedRecords.set(order, [gedcomRecord]);
          });

          return Array.from(orderedRecords.values()).flat();
        })
      );
  }

  orderedNewGedcomText(): rxjs.Observable<string[]> {
    return this.orderedNewGedcomRecords().pipe(
      rxjs.map((gedcomRecords: GedcomRecord[]) =>
        gedcomRecords.flatMap((gedcomRecord: GedcomRecord) =>
          serializeGedcomRecordToText(gedcomRecord)
        )
      )
    );
  }
}
