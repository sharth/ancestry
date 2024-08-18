import * as rxjs from 'rxjs'
import * as dexie from 'dexie';
import * as gedcom from '../gedcom'

class AncestryDatabase extends dexie.Dexie {
  originalText!: dexie.Dexie.Table<{text: string}>;
  headers!: dexie.Dexie.Table<gedcom.GedcomHeader>;
  submitters!: dexie.Dexie.Table<gedcom.GedcomSubmitter>;
  trailers!: dexie.Dexie.Table<gedcom.GedcomTrailer>;
  repositories!: dexie.Dexie.Table<gedcom.GedcomRepository, string>;
  sources!: dexie.Dexie.Table<gedcom.GedcomSource, string>;
  individuals!: dexie.Dexie.Table<gedcom.GedcomIndividual, string>;
  families!: dexie.Dexie.Table<gedcom.GedcomFamily, string>;
  multimedia!: dexie.Dexie.Table<gedcom.GedcomMultimedia, string>;
  
  constructor() {
    super('AncestryDatabase');
    this.version(1).stores({
      'originalText': '++',
      'headers': '++',
      'trailers': '++',
      'repositories': 'xref',
      'sources': 'xref',
      'individuals': 'xref',
      'families': 'xref, husbandXref, wifeXref, *childXrefs',
      'multimedia': 'xref',
    });
    this.version(2).upgrade((tx) => tx.table('sources').toCollection().modify((source) => {
      (source as gedcom.GedcomSource).multimediaXrefs = [];
    }));
    this.version(3).stores({
      'submitters': '++',
    })  

    this.headers.mapToClass(gedcom.GedcomHeader);
    this.submitters.mapToClass(gedcom.GedcomSubmitter);
    this.trailers.mapToClass(gedcom.GedcomTrailer);
    this.repositories.mapToClass(gedcom.GedcomRepository);
    this.sources.mapToClass(gedcom.GedcomSource);
    this.individuals.mapToClass(gedcom.GedcomIndividual);
    this.families.mapToClass(gedcom.GedcomFamily);
    this.multimedia.mapToClass(gedcom.GedcomMultimedia);
  }
}

export const ancestryDatabase = new AncestryDatabase();

export function parentsOfGedcomFamily(gedcomFamily: gedcom.GedcomFamily): rxjs.Observable<gedcom.GedcomIndividual[]> {
  return rxjs.of([gedcomFamily.husbandXref, gedcomFamily.wifeXref]).pipe(
    rxjs.map((parentXrefs) => parentXrefs.filter((parentXref) => parentXref != null)),
    rxjs.map((parentXrefs) => parentXrefs.map(
      (parentXref) => dexie.liveQuery(() => ancestryDatabase.individuals.get(parentXref)))),
    rxjs.switchMap((parentObservables) => rxjs.combineLatest(parentObservables)),
    rxjs.map((parents) => parents.filter((parent) => parent != null)),
  );
}

// export function parentsOfGedcomIndividual(gedcomIndividual: GedcomIndividual): rxjs.Observable<GedcomIndividual[]> {
//   const families$ = rxjs.from(liveQuery(() => ancestryDatabase.families
//     .filter((family) => family.childXrefs.includes(gedcomIndividual.xref))
//     .toArray()));
//   return families$.pipe(
//     rxjs.map((familes) => families$.)
//   );
// }

export function childrenOfGedcomFamily(gedcomFamily: gedcom.GedcomFamily): rxjs.Observable<gedcom.GedcomIndividual[]> {
  return rxjs.of(gedcomFamily.childXrefs).pipe(
    rxjs.map((childXrefs) => childXrefs.map(
      (childXref) => dexie.liveQuery(() => ancestryDatabase.individuals.get(childXref)))),
    rxjs.switchMap((childObservables) => rxjs.combineLatest(childObservables)),
    rxjs.map((children) => children.filter((child) => child != null)),
  )
}

// export function parentsOfGedcomIndividual(gedcomIndividual: GedcomIndividual): rxjs.Observable<GedcomIndividual[]> {
//   return rxjs.from(liveQuery(() => ancestryDatabase.families.toArray())).pipe(
//     rxjs.map((families) => families.filter((family) => family.childXrefs.includes(gedcomIndividual.xref))), 
//   )
// }


// export function familiesIncludingChild(gedcomIndividual: GedcomIndividual): rxjs.Observable<GedcomFamily[]> {
//   return rxjs.from(liveQuery(() => ancestryDatabase.families
//       .filter((family) => family.childXrefs.includes(gedcomIndividual.xref))
//       .toArray()
//   ));
// }

// export function familiesIncludingParent(gedcomIndividual: GedcomIndividual): rxjs.Observable<GedcomFamily[]> {
//   return rxjs.from(liveQuery(() => ancestryDatabase.families
//       .filter((family) => family.husbandXref == gedcomIndividual.xref || family.wifeXref == gedcomIndividual.xref)
//       .toArray()
//   ));
// }

//   // return rxjs.combineLatestWith(
//   //   liveQuery(() => ancestryDatabase.individuals.get(gedcomFamily.husbandXref))
//   // )
//   // return rxjs.of([gedcomFamily.husbandXref, gedcomFamily.wifeXref]).pipe(
//   //   rxjs.map((parentXrefs) => parentXrefs.filter((parentXref) => parentXref != null)),
//   //   rxjs.switchMap((parentXrefs) => rxjs.combineLatestWith(parentXrefs.map((parentXref) => liveQuery(() => ancestryDatabase.individuals.get(parentXref))))),
//   // )
//   // rxjs.from(liveQuery(() => [gedcomFamily.husbandXref, gedcomFamily.wifeXref]
//   //   // .filter((parentXref) => parentXref != null)
//   //   // .map((parentXref) => ancestryDatabase.individuals.get(parentXref))))
//   //   .pipe(
//   //     rxjs.switchMap()
//   //   )
// }

// export function parentsOfGedcomIndividual(gedcomIndividual: GedcomIndividual): rxjs.Observable<(GedcomIndividual | undefined)[]> {
//   return rxjs.from(liveQuery(() => ancestryDatabase.families
//       .filter((family) => family.childXrefs.includes(gedcomIndividual.xref))
//       .toArray()))
//     .pipe(
//       rxjs.map((families) => families.flatMap((family) => [family.husbandXref, family.wifeXref])),
//       rxjs.map((parentXrefs) => parentXrefs.filter((parentXref) => parentXref != null)),
//       rxjs.map((parentXrefs) => parentXrefs.map((parentXref) => ancestryDatabase.individuals.get(parentXref))),
//   );
// }