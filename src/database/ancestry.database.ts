import * as rxjs from 'rxjs'
import {Dexie, liveQuery} from 'dexie';
import {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomRepository} from '../gedcom/gedcomRepository';
import {GedcomIndividual} from '../gedcom/gedcomIndividual';
import {GedcomFamily} from '../gedcom/gedcomFamily';

class AncestryDatabase extends Dexie {
  repositories!: Dexie.Table<GedcomRepository, string>;
  sources!: Dexie.Table<GedcomSource, string>;
  individuals!: Dexie.Table<GedcomIndividual, string>;
  families!: Dexie.Table<GedcomFamily, string>;

  constructor() {
    super('AncestryDatabase');
    this.version(1).stores({
      'repositories': 'xref',
      'sources': 'xref',
      'individuals': 'xref',
      'families': 'xref, husbandXref, wifeXref, *childXrefs',
    });

    this.repositories.mapToClass(GedcomRepository);
    this.sources.mapToClass(GedcomSource);
    this.individuals.mapToClass(GedcomIndividual);
    this.families.mapToClass(GedcomFamily);
  }
}

export const ancestryDatabase = new AncestryDatabase();

export function parentsOfGedcomFamily(gedcomFamily: GedcomFamily): rxjs.Observable<GedcomIndividual[]> {
  return rxjs.of([gedcomFamily.husbandXref, gedcomFamily.wifeXref]).pipe(
    rxjs.map((parentXrefs) => parentXrefs.filter((parentXref) => parentXref != null)),
    rxjs.map((parentXrefs) => parentXrefs.map(
      (parentXref) => liveQuery(() => ancestryDatabase.individuals.get(parentXref)))),
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

export function childrenOfGedcomFamily(gedcomFamily: GedcomFamily): rxjs.Observable<GedcomIndividual[]> {
  return rxjs.of(gedcomFamily.childXrefs).pipe(
    rxjs.map((childXrefs) => childXrefs.map(
      (childXref) => liveQuery(() => ancestryDatabase.individuals.get(childXref)))),
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