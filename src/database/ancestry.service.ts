import type { GedcomFamily } from "../gedcom/gedcomFamily";
import { parseGedcomFamily } from "../gedcom/gedcomFamily";
import type { GedcomHeader } from "../gedcom/gedcomHeader";
import { parseGedcomHeader } from "../gedcom/gedcomHeader";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import { parseGedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { parseGedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { parseGedcomRecords } from "../gedcom/gedcomRecord";
import type { GedcomRepository } from "../gedcom/gedcomRepository";
import { parseGedcomRepository } from "../gedcom/gedcomRepository";
import type { GedcomSource } from "../gedcom/gedcomSource";
import { parseGedcomSource } from "../gedcom/gedcomSource";
import type { GedcomSubmitter } from "../gedcom/gedcomSubmitter";
import { parseGedcomSubmitter } from "../gedcom/gedcomSubmitter";
import type { GedcomTrailer } from "../gedcom/gedcomTrailer";
import { parseGedcomTrailer } from "../gedcom/gedcomTrailer";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { AncestryDatabase } from "./ancestry.database";
import { Injectable, resource, signal } from "@angular/core";
import Dexie from "dexie";

@Injectable({ providedIn: "root" })
export class AncestryService {
  readonly ancestryDatabase = new AncestryDatabase();

  // A signal that increments every time the Dexie / IndexedDB database changes.
  // This can be used in the request field for an Angular Resource.
  readonly ancestryChanges = signal(0);

  constructor() {
    Dexie.on("storagemutated", () => {
      console.log("Dexie database mutated");
      this.ancestryChanges.update((value) => value + 1);
    });
  }

  ancestryResource = resource({
    params: () => ({
      changeCount: this.ancestryChanges(),
    }),
    loader: async () => {
      const [
        individuals,
        sources,
        families,
        repositories,
        multimedia,
        submitters,
        headers,
        originalRecords,
      ] = await this.ancestryDatabase.transaction(
        "r",
        [
          "individuals",
          "sources",
          "families",
          "repositories",
          "multimedia",
          "submitters",
          "headers",
          "originalRecords",
        ],
        async () => [
          await this.ancestryDatabase.individuals.orderBy("xref").toArray(),
          await this.ancestryDatabase.sources.orderBy("xref").toArray(),
          await this.ancestryDatabase.families.orderBy("xref").toArray(),
          await this.ancestryDatabase.repositories.orderBy("xref").toArray(),
          await this.ancestryDatabase.multimedia.orderBy("xref").toArray(),
          await this.ancestryDatabase.submitters.orderBy("xref").toArray(),
          await this.ancestryDatabase.headers.toArray(),
          await this.ancestryDatabase.originalRecords.toArray(),
        ],
      );
      return {
        individuals: new Map(individuals.map((indi) => [indi.xref, indi])),
        sources: new Map(sources.map((source) => [source.xref, source])),
        families: new Map(families.map((family) => [family.xref, family])),
        repositories: new Map(repositories.map((repo) => [repo.xref, repo])),
        multimedia: new Map(multimedia.map((media) => [media.xref, media])),
        submitters: new Map(submitters.map((s) => [s.xref, s])),
        headers,
        originalRecords,
      };
    },
  });

  initializeDatabase(text: string): Promise<void> {
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

    // For whatever reason, GEDCOM has the family references in both the FAM and INDI.
    // Ensure that these are consistent.
    const individualMap = new Map(individuals.map((indi) => [indi.xref, indi]));
    for (const family of families) {
      if (family.husbandXref) {
        const husband = individualMap.get(family.husbandXref);
        if (!husband) throw new Error();
        if (!husband.parentOfFamilyXref.includes(family.xref))
          throw new Error();
      }
      if (family.wifeXref) {
        const wife = individualMap.get(family.wifeXref);
        if (!wife) throw new Error();
        if (!wife.parentOfFamilyXref.includes(family.xref)) throw new Error();
      }
      for (const childXref of family.childXrefs) {
        const child = individualMap.get(childXref);
        if (!child) throw new Error();
        if (!child.childOfFamilyXref.includes(family.xref)) throw new Error();
      }
    }
    const familyMap = new Map(families.map((family) => [family.xref, family]));
    for (const individual of individuals) {
      for (const familyXref of individual.parentOfFamilyXref) {
        const family = familyMap.get(familyXref);
        const parents = [family?.husbandXref, family?.wifeXref].filter(
          (e) => e != null,
        );
        if (!family) throw new Error();
        if (!parents.includes(individual.xref)) throw new Error();
      }
      for (const familyXref of individual.childOfFamilyXref) {
        const family = familyMap.get(familyXref);
        if (!family) throw new Error();
        if (!family.childXrefs.includes(individual.xref)) throw new Error();
      }
    }

    return this.ancestryDatabase.transaction(
      "readwrite",
      [
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
        await this.ancestryDatabase.originalRecords.clear();
        await this.ancestryDatabase.originalRecords.bulkAdd(gedcomRecords);
        await this.ancestryDatabase.headers.clear();
        await this.ancestryDatabase.headers.bulkAdd(headers);
        await this.ancestryDatabase.submitters.clear();
        await this.ancestryDatabase.submitters.bulkAdd(submitters);
        await this.ancestryDatabase.trailers.clear();
        await this.ancestryDatabase.trailers.bulkAdd(trailers);
        await this.ancestryDatabase.individuals.clear();
        await this.ancestryDatabase.individuals.bulkAdd(individuals);
        await this.ancestryDatabase.families.clear();
        await this.ancestryDatabase.families.bulkAdd(families);
        await this.ancestryDatabase.repositories.clear();
        await this.ancestryDatabase.repositories.bulkAdd(repositories);
        await this.ancestryDatabase.sources.clear();
        await this.ancestryDatabase.sources.bulkAdd(sources);
        await this.ancestryDatabase.multimedia.clear();
        await this.ancestryDatabase.multimedia.bulkAdd(multimedia);
      },
    );
  }
}
