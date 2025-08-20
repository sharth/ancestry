import type { GedcomFamily } from "../gedcom/gedcomFamily";
import { parseGedcomFamily } from "../gedcom/gedcomFamily";
import type { GedcomHeader } from "../gedcom/gedcomHeader";
import { parseGedcomHeader } from "../gedcom/gedcomHeader";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import { parseGedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";
import { parseGedcomMultimedia } from "../gedcom/gedcomMultimedia";
import {
  mergeConcContRecords,
  parseGedcomRecords,
} from "../gedcom/gedcomRecord";
import type { GedcomRepository } from "../gedcom/gedcomRepository";
import { parseGedcomRepository } from "../gedcom/gedcomRepository";
import type { GedcomSource } from "../gedcom/gedcomSource";
import { parseGedcomSource } from "../gedcom/gedcomSource";
import type { GedcomSubmitter } from "../gedcom/gedcomSubmitter";
import { parseGedcomSubmitter } from "../gedcom/gedcomSubmitter";
import type { GedcomTrailer } from "../gedcom/gedcomTrailer";
import { parseGedcomTrailer } from "../gedcom/gedcomTrailer";
import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { Injectable, computed, resource, signal } from "@angular/core";
import Dexie from "dexie";

class DexieDatabase extends Dexie {
  gedcomFiles!: Dexie.Table<FileSystemFileHandle>;

  constructor() {
    super("AncestryDatabase");
    this.version(2).stores({
      gedcomFiles: "++, fileHandle",
    });
  }
}

@Injectable({ providedIn: "root" })
export class AncestryService {
  readonly dexieDatabase = new DexieDatabase();

  // A signal that increments every time the Dexie / IndexedDB database changes.
  // This can be used in the request field for an Angular Resource.
  readonly ancestryChanges = signal(0);

  constructor() {
    Dexie.on("storagemutated", () => {
      console.log("Dexie database mutated");
      this.ancestryChanges.update((value) => value + 1);
    });
  }

  private readonly gedcomResource = resource({
    params: () => ({
      changeCount: this.ancestryChanges(),
    }),
    loader: async () => {
      const fileHandle = await this.dexieDatabase.gedcomFiles
        .toCollection()
        .first();

      const gedcomFile = await fileHandle?.getFile();
      const gedcomText = await gedcomFile?.text();
      const rawGedcomRecords = parseGedcomRecords(gedcomText ?? "");
      const gedcomRecords = rawGedcomRecords.map((gedcomRecord) =>
        mergeConcContRecords(gedcomRecord),
      );

      const headers = new Array<GedcomHeader>();
      const trailers = new Array<GedcomTrailer>();
      const submitters = new Map<string, GedcomSubmitter>();
      const individuals = new Map<string, GedcomIndividual>();
      const families = new Map<string, GedcomFamily>();
      const repositories = new Map<string, GedcomRepository>();
      const sources = new Map<string, GedcomSource>();
      const multimedias = new Map<string, GedcomMultimedia>();

      for (const gedcomRecord of gedcomRecords) {
        switch (gedcomRecord.tag) {
          case "HEAD":
            headers.push(parseGedcomHeader(gedcomRecord));
            break;
          case "TRLR":
            trailers.push(parseGedcomTrailer(gedcomRecord));
            break;
          case "SUBM": {
            const submitter = parseGedcomSubmitter(gedcomRecord);
            submitters.set(submitter.xref, submitter);
            break;
          }
          case "INDI": {
            const individual = parseGedcomIndividual(gedcomRecord);
            individuals.set(individual.xref, individual);
            break;
          }
          case "FAM": {
            const family = parseGedcomFamily(gedcomRecord);
            families.set(family.xref, family);
            break;
          }
          case "REPO": {
            const repository = parseGedcomRepository(gedcomRecord);
            repositories.set(repository.xref, repository);
            break;
          }
          case "SOUR": {
            const source = parseGedcomSource(gedcomRecord);
            sources.set(source.xref, source);
            break;
          }
          case "OBJE": {
            const multimedia = parseGedcomMultimedia(gedcomRecord);
            multimedias.set(multimedia.xref, multimedia);
            break;
          }
          default:
            reportUnparsedRecord(gedcomRecord);
            break;
        }
      }

      // For whatever reason, GEDCOM has the family references in both the FAM and INDI.
      // Ensure that these are consistent.
      for (const family of families.values()) {
        if (family.husbandXref) {
          const husband = individuals.get(family.husbandXref);
          if (!husband) throw new Error();
          if (!husband.parentOfFamilyXrefs.includes(family.xref))
            throw new Error();
        }
        if (family.wifeXref) {
          const wife = individuals.get(family.wifeXref);
          if (!wife) throw new Error();
          if (!wife.parentOfFamilyXrefs.includes(family.xref))
            throw new Error();
        }
        for (const childXref of family.childXrefs) {
          const child = individuals.get(childXref);
          if (!child) throw new Error();
          if (!child.childOfFamilyXrefs.includes(family.xref))
            throw new Error();
        }
      }
      for (const individual of individuals.values()) {
        for (const familyXref of individual.parentOfFamilyXrefs) {
          const family = families.get(familyXref);
          const parents = [family?.husbandXref, family?.wifeXref].filter(
            (e) => e != null,
          );
          if (!family) throw new Error();
          if (!parents.includes(individual.xref)) throw new Error();
        }
        for (const familyXref of individual.childOfFamilyXrefs) {
          const family = families.get(familyXref);
          if (!family) throw new Error();
          if (!family.childXrefs.includes(individual.xref)) throw new Error();
        }
      }

      return {
        gedcomFile,
        gedcomText,
        gedcomRecords: rawGedcomRecords,
        headers,
        trailers,
        individuals,
        sources,
        families,
        repositories,
        multimedias,
        submitters,
      };
    },
  });

  contents = computed(() => this.gedcomResource.value());

  async openGedcom(fileHandle: FileSystemFileHandle) {
    await this.dexieDatabase.transaction(
      "rw",
      this.dexieDatabase.gedcomFiles,
      async () => {
        await this.dexieDatabase.gedcomFiles.clear();
        await this.dexieDatabase.gedcomFiles.put(fileHandle);
      },
    );
  }

  async requestPermissions() {
    const fileHandle = await this.dexieDatabase.gedcomFiles
      .toCollection()
      .first();
    await fileHandle?.requestPermission();
    this.gedcomResource.reload();
  }

  readonly nextIndividualXref = computed<string | undefined>(() => {
    const individuals = this.gedcomResource.value()?.individuals;
    if (individuals == undefined) {
      return undefined;
    }
    const nextIndex = individuals
      .values()
      .map((individual) => /^@I(\d+)@/.exec(individual.xref))
      .filter((match) => match != undefined)
      .map((match) => parseInt(match[1]))
      .reduce((acc, index) => Math.max(acc, index + 1), 0);
    return `@I${nextIndex}@`;
  });

  readonly nextSourceXref = computed<string | undefined>(() => {
    const sources = this.gedcomResource.value()?.sources;
    if (sources == undefined) {
      return undefined;
    }
    const nextIndex = sources
      .values()
      .map((source) => /^S@(\d+)@/.exec(source.xref))
      .filter((match) => match != undefined)
      .map((match) => parseInt(match[1], 10))
      .reduce((acc, index) => Math.max(acc, index + 1), 0);
    return `@S${nextIndex}@`;
  });
}
