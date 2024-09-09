import {ancestryDatabase} from '../database/ancestry.database';
import * as dexie from 'dexie';
import * as gedcom from '../gedcom';

export class AncestryService {
  private readonly unparsedTags = new Set<string>();

  parseText(text: string) {
    const headers: gedcom.GedcomHeader[] = [];
    const submitters: gedcom.GedcomSubmitter[] = [];
    const trailers: gedcom.GedcomTrailer[] = [];
    const individuals: gedcom.GedcomIndividual[] = [];
    const families: gedcom.GedcomFamily[] = [];
    const repositories: gedcom.GedcomRepository[] = [];
    const sources: gedcom.GedcomSource[] = [];
    const multimedia: gedcom.GedcomMultimedia[] = [];
    
    for (const gedcomRecord of gedcom.parseGedcomRecordsFromText(text)) {
      switch (gedcomRecord.tag) {
        case 'HEAD':
          headers.push(new gedcom.GedcomHeader(gedcomRecord));
          break;
        case 'SUBM':
          submitters.push(gedcom.constructGedcomSubmitterFromGedcomRecord(gedcomRecord));
          break;
        case 'TRLR':
          trailers.push(new gedcom.GedcomTrailer(gedcomRecord));
          break;
        case 'INDI':
          individuals.push(gedcom.parseGedcomIndividualFromGedcomRecord(gedcomRecord));
          break;
        case 'FAM':
          families.push(gedcom.parseGedcomFamilyFromGedcomRecord(gedcomRecord));
          break;
        case 'REPO':
          repositories.push(new gedcom.GedcomRepository(gedcomRecord));
          break;
        case 'SOUR':
          sources.push(gedcom.constructSourceFromGedcomRecord(gedcomRecord));
          break;
        case 'OBJE':
          multimedia.push(gedcom.constructGedcomMultimediaFromGedcomRecord(gedcomRecord));
          break;
        default:
          this.reportUnparsedRecord(gedcomRecord);
          break;
      }
    }

    ancestryDatabase.transaction(
      "readwrite",
      ["originalText", "headers", "submitters", "trailers", "individuals", "families", "repositories", "sources", "multimedia"],
      async () => {
        await ancestryDatabase.originalText.clear();
        await ancestryDatabase.originalText.add({text: text});
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
      }).catch((err: unknown) => {
        if (err instanceof dexie.Dexie.BulkError)
          console.log(err.stack);
      });
  }

  reportUnparsedRecord(gedcomRecord: gedcom.GedcomRecord): void {
    if (!this.unparsedTags.has(gedcomRecord.abstag)) {
      console.warn('Unparsed tag ', gedcomRecord.abstag);
      this.unparsedTags.add(gedcomRecord.abstag);
    }
  }
}

export const ancestryService = new AncestryService;
