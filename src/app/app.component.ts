import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import type {
  GedcomFamily,
  GedcomHeader,
  GedcomIndividual,
  GedcomMultimedia,
  GedcomRepository,
  GedcomSource,
  GedcomSubmitter,
  GedcomTrailer,
} from "../gedcom";
import {
  generateGedcomRecords,
  parseGedcomFamily,
  parseGedcomHeader,
  parseGedcomIndividual,
  parseGedcomMultimedia,
  parseGedcomRepository,
  parseGedcomSource,
  parseGedcomSubmitter,
  parseGedcomTrailer,
} from "../gedcom";
import { Dexie } from "dexie";
import { ancestryDatabase } from "../database/ancestry.database";
import { reportUnparsedRecord } from "../util/record-unparsed-records";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  async openFile(): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Gedcom Files",
          accept: { "text/plain": [".ged"] },
        },
      ],
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    this.parseText(text);
  }

  parseText(text: string) {
    const headers: GedcomHeader[] = [];
    const submitters: GedcomSubmitter[] = [];
    const trailers: GedcomTrailer[] = [];
    const individuals: GedcomIndividual[] = [];
    const families: GedcomFamily[] = [];
    const repositories: GedcomRepository[] = [];
    const sources: GedcomSource[] = [];
    const multimedia: GedcomMultimedia[] = [];

    for (const gedcomRecord of generateGedcomRecords(text)) {
      switch (gedcomRecord.tag) {
        case "HEAD":
          headers.push(parseGedcomHeader(gedcomRecord));
          break;
        case "SUBM":
          submitters.push(parseGedcomSubmitter(gedcomRecord));
          break;
        case "TRLR":
          trailers.push(parseGedcomTrailer(gedcomRecord));
          break;
        case "INDI":
          individuals.push(parseGedcomIndividual(gedcomRecord));
          break;
        case "FAM":
          families.push(parseGedcomFamily(gedcomRecord));
          break;
        case "REPO":
          repositories.push(parseGedcomRepository(gedcomRecord));
          break;
        case "SOUR":
          sources.push(parseGedcomSource(gedcomRecord));
          break;
        case "OBJE":
          multimedia.push(parseGedcomMultimedia(gedcomRecord));
          break;
        default:
          reportUnparsedRecord(gedcomRecord);
          break;
      }
    }

    ancestryDatabase
      .transaction(
        "readwrite",
        [
          "originalText",
          "headers",
          "submitters",
          "trailers",
          "individuals",
          "families",
          "repositories",
          "sources",
          "multimedia",
        ],
        async () => {
          await ancestryDatabase.originalText.clear();
          await ancestryDatabase.originalText.add({ text: text });
          await ancestryDatabase.headers.clear();
          await ancestryDatabase.headers.bulkAdd(headers);
          await ancestryDatabase.submitters.clear();
          await ancestryDatabase.submitters.bulkAdd(submitters);
          await ancestryDatabase.trailers.clear();
          await ancestryDatabase.trailers.bulkAdd(trailers);
          await ancestryDatabase.individuals.clear();
          await ancestryDatabase.individuals.bulkAdd(individuals);
          await ancestryDatabase.families.clear();
          await ancestryDatabase.families.bulkAdd(families);
          await ancestryDatabase.repositories.clear();
          await ancestryDatabase.repositories.bulkAdd(repositories);
          await ancestryDatabase.sources.clear();
          await ancestryDatabase.sources.bulkAdd(sources);
          await ancestryDatabase.multimedia.clear();
          await ancestryDatabase.multimedia.bulkAdd(multimedia);
        }
      )
      .catch((err: unknown) => {
        if (err instanceof Dexie.BulkError) {
          console.log(err.stack);
        }
      });
  }
}
