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

@Component({
  selector: "app-gedcom",
  standalone: true,
  imports: [CommonModule, GedcomDiffComponent],
  templateUrl: "./gedcom.component.html",
  styleUrl: "./gedcom.component.css",
})
export class GedcomComponent {
  readonly vm$ = rxjs
    .combineLatest([this.oldGedcomText(), this.newGedcomRecords()])
    .pipe(
      rxjs.map(([oldGedcomText, newGedcomRecords]) => ({
        oldGedcomText: oldGedcomText,
        newGedcomText: newGedcomRecords
          .flatMap(serializeGedcomRecordToText)
          .join("\r\n"),
      }))
    );

  oldGedcomText(): rxjs.Observable<string> {
    return rxjs.from(
      dexie.liveQuery(async () => {
        const [{ text: originalText }] =
          await ancestryDatabase.originalText.toArray();
        return originalText;
      })
    );
  }

  // Current set of GedcomRecords, but organized similarly to the text that came in from the user.
  newGedcomRecords(): rxjs.Observable<GedcomRecord[]> {
    return rxjs.from(
      dexie.liveQuery(async () => {
        const newGedcomRecords = [
          ...(await ancestryDatabase.headers.toArray()).map(
            serializeGedcomHeader
          ),
          ...(await ancestryDatabase.submitters.toArray()).map(
            (submitter) => submitter.gedcomRecord
          ),
          ...(await ancestryDatabase.trailers.toArray()).map(
            serializeGedcomTrailer
          ),
          ...(await ancestryDatabase.individuals.toArray()).map(
            serializeGedcomIndividual
          ),
          ...(await ancestryDatabase.families.toArray()).map(
            serializeGedcomFamily
          ),
          ...(await ancestryDatabase.sources.toArray()).map(
            serializeGedcomSource
          ),
          ...(await ancestryDatabase.repositories.toArray()).map(
            serializeGedcomRepository
          ),
          ...(await ancestryDatabase.multimedia.toArray()).map(
            serializeGedcomMultimedia
          ),
        ];

        // We'd like to reorder the gedcom records more or less in the order that we received the file.
        const [{ text: oldGedcomText }] =
          await ancestryDatabase.originalText.toArray();
        const oldGedcomRecords = parseGedcomRecords(oldGedcomText);

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
}
