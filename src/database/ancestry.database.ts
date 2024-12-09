import { Dexie } from "dexie";
import {
  GedcomHeader,
  GedcomSubmitter,
  GedcomTrailer,
  GedcomRepository,
  GedcomSource,
  GedcomIndividual,
  GedcomFamily,
  GedcomMultimedia,
} from "../gedcom";

class AncestryDatabase extends Dexie {
  originalText!: Dexie.Table<{ text: string }>;
  headers!: Dexie.Table<GedcomHeader>;
  submitters!: Dexie.Table<GedcomSubmitter, string>;
  trailers!: Dexie.Table<GedcomTrailer>;
  repositories!: Dexie.Table<GedcomRepository, string>;
  sources!: Dexie.Table<GedcomSource, string>;
  individuals!: Dexie.Table<GedcomIndividual, string>;
  families!: Dexie.Table<GedcomFamily, string>;
  multimedia!: Dexie.Table<GedcomMultimedia, string>;

  constructor() {
    super("AncestryDatabase");
    this.version(1).stores({
      originalText: "++",
      headers: "++",
      trailers: "++",
      repositories: "xref",
      sources: "xref",
      individuals: "xref",
      families: "xref, husbandXref, wifeXref, *childXrefs",
      multimedia: "xref",
    });
    this.version(2).upgrade((tx) =>
      tx
        .table("sources")
        .toCollection()
        .modify((source) => {
          (source as GedcomSource).multimediaXrefs = [];
        })
    );
    this.version(4).stores({
      submitters: "xref",
    });

    this.headers.mapToClass(GedcomHeader);
    this.submitters.mapToClass(GedcomSubmitter);
    this.trailers.mapToClass(GedcomTrailer);
    this.repositories.mapToClass(GedcomRepository);
    this.sources.mapToClass(GedcomSource);
    this.individuals.mapToClass(GedcomIndividual);
    this.families.mapToClass(GedcomFamily);
    this.multimedia.mapToClass(GedcomMultimedia);
  }
}

export const ancestryDatabase = new AncestryDatabase();
