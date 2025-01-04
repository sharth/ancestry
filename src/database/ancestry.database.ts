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
} from "../gedcom";

export class AncestryDatabase extends Dexie {
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          source.multimediaXrefs = [];
        })
    );
    this.version(4).stores({
      submitters: "xref",
    });
    this.version(5).upgrade((tx) =>
      tx
        .table("sources")
        .toCollection()
        .modify((source) => {
          // eslint-disable-next-line max-len
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          (source as GedcomSource).multimediaLinks = source.multimediaXrefs.map(
            (multimediaXref: string) => ({
              multimediaXref,
            })
          );
        })
    );
  }
}
