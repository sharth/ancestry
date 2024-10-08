import { ancestryDatabase } from "../database/ancestry.database";
import * as dexie from "dexie";
import * as gedcom from "../gedcom";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { GedcomParser } from "../util/gedcom-parser";
import { GedcomLexer } from "../util/gedcom-lexer";

export class AncestryService {
  parseText(text: string) {
    const lexer = new GedcomLexer();
    const parser = new GedcomParser();

    const headers: gedcom.GedcomHeader[] = [];
    const submitters: gedcom.GedcomSubmitter[] = [];
    const trailers: gedcom.GedcomTrailer[] = [];
    const individuals: gedcom.GedcomIndividual[] = [];
    const families: gedcom.GedcomFamily[] = [];
    const repositories: gedcom.GedcomRepository[] = [];
    const sources: gedcom.GedcomSource[] = [];
    const multimedia: gedcom.GedcomMultimedia[] = [];

    for (const gedcomRecord of lexer.generateGedcomRecords(text)) {
      switch (gedcomRecord.tag) {
        case "HEAD":
          headers.push(new gedcom.GedcomHeader(gedcomRecord));
          break;
        case "SUBM":
          submitters.push(parser.parseGedcomSubmitter(gedcomRecord));
          break;
        case "TRLR":
          trailers.push(parser.parseGedcomTrailer(gedcomRecord));
          break;
        case "INDI":
          individuals.push(parser.parseGedcomIndividual(gedcomRecord));
          break;
        case "FAM":
          families.push(parser.parseGedcomFamily(gedcomRecord));
          break;
        case "REPO":
          repositories.push(parser.parseGedcomRepository(gedcomRecord));
          break;
        case "SOUR":
          sources.push(parser.parseGedcomSource(gedcomRecord));
          break;
        case "OBJE":
          multimedia.push(parser.parseGedcomMultimedia(gedcomRecord));
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
        if (err instanceof dexie.Dexie.BulkError) console.log(err.stack);
      });
  }
}

export const ancestryService = new AncestryService();
