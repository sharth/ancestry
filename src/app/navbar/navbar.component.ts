import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import type {
  GedcomFamily,
  GedcomHeader,
  GedcomIndividual,
  GedcomMultimedia,
  GedcomRepository,
  GedcomSource,
  GedcomSubmitter,
  GedcomTrailer,
} from "../../gedcom";
import {
  parseGedcomFamily,
  parseGedcomHeader,
  parseGedcomIndividual,
  parseGedcomMultimedia,
  parseGedcomRecords,
  parseGedcomRepository,
  parseGedcomSource,
  parseGedcomSubmitter,
  parseGedcomTrailer,
} from "../../gedcom";
import { reportUnparsedRecord } from "../../util/record-unparsed-records";
import { AncestryService } from "../../database/ancestry.service";
import type { AncestryDatabase } from "../../database/ancestry.database";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly ancestryDatabase = this.ancestryService.ancestryDatabase;

  openFile() {
    pickFileFromUser()
      .then((file) => readFile(file))
      .then((text) => parseText(this.ancestryDatabase, text))
      .then(() => {
        console.log("Parsing complete");
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }
}

async function pickFileFromUser(): Promise<File> {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [
      {
        description: "Gedcom Files",
        accept: { "text/plain": [".ged"] },
      },
    ],
  });
  return fileHandle.getFile();
}

function readFile(file: File): Promise<string> {
  return file.text();
}

function parseText(
  ancestryDatabase: AncestryDatabase,
  text: string
): Promise<void> {
  const headers: GedcomHeader[] = [];
  const submitters: GedcomSubmitter[] = [];
  const trailers: GedcomTrailer[] = [];
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];
  const repositories: GedcomRepository[] = [];
  const sources: GedcomSource[] = [];
  const multimedia: GedcomMultimedia[] = [];

  const gedcomRecords = parseGedcomRecords(text);
  for (const gedcomRecord of gedcomRecords) {
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

  return ancestryDatabase.transaction(
    "readwrite",
    [
      "originalText",
      "originalRecords",
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
      await ancestryDatabase.originalRecords.clear();
      await ancestryDatabase.originalRecords.bulkAdd(gedcomRecords);
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
  );
}
