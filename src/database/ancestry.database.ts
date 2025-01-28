import { Dexie } from "dexie";
import type {
  GedcomHeader,
  GedcomSubmitter,
  GedcomTrailer,
  GedcomRepository,
  GedcomSource,
  GedcomIndividual,
  GedcomFamily,
  GedcomMultimedia,
  GedcomRecord,
} from "../gedcom";

export class AncestryDatabase extends Dexie {
  originalRecords!: Dexie.Table<GedcomRecord>;
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
      originalRecords: "++, tag, xref",
      headers: "++",
      trailers: "++",
      repositories: "xref",
      sources: "xref",
      individuals: "xref",
      families: "xref, husbandXref, wifeXref, *childXrefs",
      multimedia: "xref",
      submitters: "xref",
    });
  }
}
