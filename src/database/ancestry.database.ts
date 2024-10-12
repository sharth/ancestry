import * as rxjs from "rxjs";
import * as dexie from "dexie";
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

class AncestryDatabase extends dexie.Dexie {
  originalText!: dexie.Dexie.Table<{ text: string }>;
  headers!: dexie.Dexie.Table<GedcomHeader>;
  submitters!: dexie.Dexie.Table<GedcomSubmitter, string>;
  trailers!: dexie.Dexie.Table<GedcomTrailer>;
  repositories!: dexie.Dexie.Table<GedcomRepository, string>;
  sources!: dexie.Dexie.Table<GedcomSource, string>;
  individuals!: dexie.Dexie.Table<GedcomIndividual, string>;
  families!: dexie.Dexie.Table<GedcomFamily, string>;
  multimedia!: dexie.Dexie.Table<GedcomMultimedia, string>;

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

export function parentsOfGedcomFamily(
  gedcomFamily: GedcomFamily
): rxjs.Observable<GedcomIndividual[]> {
  return rxjs.of([gedcomFamily.husbandXref, gedcomFamily.wifeXref]).pipe(
    rxjs.map((parentXrefs) =>
      parentXrefs.filter((parentXref) => parentXref != null)
    ),
    rxjs.map((parentXrefs) =>
      parentXrefs.map((parentXref) =>
        dexie.liveQuery(() => ancestryDatabase.individuals.get(parentXref))
      )
    ),
    rxjs.switchMap((parentObservables) =>
      rxjs.combineLatest(parentObservables)
    ),
    rxjs.map((parents) => parents.filter((parent) => parent != null))
  );
}

export function childrenOfGedcomFamily(
  gedcomFamily: GedcomFamily
): rxjs.Observable<GedcomIndividual[]> {
  return rxjs.of(gedcomFamily.childXrefs).pipe(
    rxjs.map((childXrefs) =>
      childXrefs.map((childXref) =>
        dexie.liveQuery(() => ancestryDatabase.individuals.get(childXref))
      )
    ),
    rxjs.switchMap((childObservables) => rxjs.combineLatest(childObservables)),
    rxjs.map((children) => children.filter((child) => child != null))
  );
}
