import { monthNames } from "../gedcom/gedcomDate";
import type { GedcomFamily } from "../gedcom/gedcomFamily";
import {
  parseGedcomFamily,
  serializeGedcomFamily,
} from "../gedcom/gedcomFamily";
import type { GedcomHeader } from "../gedcom/gedcomHeader";
import { parseGedcomHeader } from "../gedcom/gedcomHeader";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import {
  parseGedcomIndividual,
  serializeGedcomIndividual,
} from "../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../gedcom/gedcomMultimedia";
import {
  parseGedcomMultimedia,
  serializeGedcomMultimedia,
} from "../gedcom/gedcomMultimedia";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import {
  mergeConcContRecords,
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "../gedcom/gedcomRecord";
import type { GedcomRepository } from "../gedcom/gedcomRepository";
import {
  parseGedcomRepository,
  serializeGedcomRepository,
} from "../gedcom/gedcomRepository";
import type { GedcomSource } from "../gedcom/gedcomSource";
import {
  parseGedcomSource,
  serializeGedcomSource,
} from "../gedcom/gedcomSource";
import type { GedcomSubmitter } from "../gedcom/gedcomSubmitter";
import {
  parseGedcomSubmitter,
  serializeGedcomSubmitter,
} from "../gedcom/gedcomSubmitter";
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

  readonly gedcomResource = resource({
    params: () => ({
      changeCount: this.ancestryChanges(),
    }),
    loader: async () => {
      const gedcomFileHandle = await this.dexieDatabase.gedcomFiles
        .toCollection()
        .first();

      if (gedcomFileHandle == undefined) {
        return undefined;
      }

      const gedcomFile = await gedcomFileHandle.getFile();
      const gedcomText = await gedcomFile.text();
      const gedcomRecords = parseGedcomRecords(gedcomText);

      return { gedcomFileHandle, gedcomFile, gedcomText, gedcomRecords };
    },
  });

  readonly ancestryDatabase = computed<AncestryDatabase | undefined>(() => {
    const gedcomResourceValue = this.gedcomResource.value();
    if (gedcomResourceValue === undefined) {
      return undefined;
    }

    const gedcomRecords = gedcomResourceValue.gedcomRecords.map(
      (gedcomRecord) => mergeConcContRecords(gedcomRecord),
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
        if (!wife.parentOfFamilyXrefs.includes(family.xref)) throw new Error();
      }
      for (const childXref of family.childXrefs) {
        const child = individuals.get(childXref);
        if (!child) throw new Error();
        if (!child.childOfFamilyXrefs.includes(family.xref)) throw new Error();
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
      headers,
      trailers,
      individuals,
      sources,
      families,
      repositories,
      multimedias,
      submitters,
    };
  });

  compareGedcomDatabase(
    ancestryDatabase: AncestryDatabase,
  ): { canonicalRecord?: GedcomRecord; currentRecord?: GedcomRecord }[] {
    const gedcomResource = this.gedcomResource.value();

    function hash(gedcomRecord: GedcomRecord) {
      return `${gedcomRecord.tag} ${gedcomRecord.xref} ${gedcomRecord.value}`;
    }
    const recordMap = new Map<
      string,
      { canonicalRecord?: GedcomRecord; currentRecord?: GedcomRecord }
    >();
    gedcomResource?.gedcomRecords.forEach((gedcomRecord) => {
      recordMap.set(hash(gedcomRecord), { canonicalRecord: gedcomRecord });
    });

    const now = new Date();
    const day = now.getDate();
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    [
      {
        tag: "HEAD",
        abstag: "HEAD",
        xref: "",
        value: "",
        children: [
          {
            tag: "GEDC",
            abstag: "HEAD.GEDC",
            xref: "",
            value: "",
            children: [
              {
                tag: "VERS",
                abstag: "HEAD.GEDC.VERS",
                xref: "",
                value: "7.0.14",
                children: [],
              },
            ],
          },
          {
            tag: "SOUR",
            abstag: "HEAD.SOUR",
            xref: "",
            value: "https://github.com/sharth/ancestry",
            children: [],
          },
          {
            tag: "DATE",
            abstag: "HEAD.DATE",
            xref: "",
            value: `${day} ${month} ${year}`,
            children: [],
          },
        ],
      },
      ...ancestryDatabase.submitters
        .values()
        .map((s) => serializeGedcomSubmitter(s)),
      ...ancestryDatabase.individuals
        .values()
        .map((i) => serializeGedcomIndividual(i)),
      ...ancestryDatabase.families
        .values()
        .map((f) => serializeGedcomFamily(f)),
      ...ancestryDatabase.sources.values().map((s) => serializeGedcomSource(s)),
      ...ancestryDatabase.repositories
        .values()
        .map((r) => serializeGedcomRepository(r)),
      ...ancestryDatabase.multimedias
        .values()
        .map((m) => serializeGedcomMultimedia(m)),
      { tag: "TRLR", abstag: "TRLR", xref: "", value: "", children: [] },
    ].forEach((gedcomRecord: GedcomRecord) => {
      const h = hash(gedcomRecord);
      const r = recordMap.get(h);
      if (r === undefined) {
        recordMap.set(h, { currentRecord: gedcomRecord });
      } else {
        r.currentRecord = gedcomRecord;
      }
    });

    return recordMap.values().toArray();
  }

  serializeGedcomDatabase(ancestryDatabase: AncestryDatabase): string[] {
    return this.compareGedcomDatabase(ancestryDatabase)
      .map(({ currentRecord }) => currentRecord)
      .filter((r) => r != null)
      .flatMap((r) => serializeGedcomRecordToText(r));
  }

  async updateGedcomDatabase(ancestryDatabase: AncestryDatabase) {
    const text = this.serializeGedcomDatabase(ancestryDatabase).join("\n");

    const gedcomFileHandle = this.gedcomResource.value()?.gedcomFileHandle;
    if (gedcomFileHandle == undefined) {
      throw new Error("No GEDCOM file handle available");
    }

    const writableStream = await gedcomFileHandle.createWritable();
    await writableStream.write(text);
    await writableStream.write("\n");
    await writableStream.close();
    this.gedcomResource.reload();
  }

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

  readonly nextIndividualXref = computed<string>(() => {
    const individuals = this.ancestryDatabase()?.individuals ?? [];
    const nextIndex = individuals
      .values()
      .map((individual) => /^@I(\d+)@/.exec(individual.xref))
      .filter((match) => match != undefined)
      .map((match) => parseInt(match[1]))
      .reduce((acc, index) => Math.max(acc, index + 1), 0);
    return `@I${nextIndex}@`;
  });

  readonly nextSourceXref = computed<string>(() => {
    const sources = this.ancestryDatabase()?.sources ?? [];
    const nextIndex = sources
      .values()
      .map((source) => /^S@(\d+)@/.exec(source.xref))
      .filter((match) => match != undefined)
      .map((match) => parseInt(match[1], 10))
      .reduce((acc, index) => Math.max(acc, index + 1), 0);
    return `@S${nextIndex}@`;
  });
}

export interface AncestryDatabase {
  submitters: Map<string, GedcomSubmitter>;
  individuals: Map<string, GedcomIndividual>;
  families: Map<string, GedcomFamily>;
  sources: Map<string, GedcomSource>;
  repositories: Map<string, GedcomRepository>;
  multimedias: Map<string, GedcomMultimedia>;
}
