import {computed} from '@angular/core';
import type {AncestryService} from '../app/ancestry.service';
import type {GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';
import type {GedcomFamily} from './gedcomFamily';

export class GedcomIndividual {
  constructor(
    public xref: string,
    public gedcomRecord: GedcomRecord,
    private ancestryService: AncestryService) { }

  events: GedcomEvent[] = [];
  name?: string;
  surname?: string;
  sex?: ('Male' | 'Female');
  familySearchId?: string;

  readonly childOfFamilies = computed<GedcomFamily[]>(() => {
    return Array.from(this.ancestryService.families().values())
        .filter((family) => family.childXrefs.includes(this.xref));
  });

  readonly parentOfFamilies = computed<GedcomFamily[]>(() => {
    return Array.from(this.ancestryService.families().values())
        .filter((family) => family.parentXrefs.includes(this.xref));
  });

  readonly parents = computed<GedcomIndividual[]>(() => {
    //  TODO: Need to unique this.
    return this.childOfFamilies()
        .flatMap((family) => family.parents());
  });

  readonly siblings = computed<GedcomIndividual[]>(() => {
    return this.childOfFamilies()
        .flatMap((family) => family.children())
        .filter((child) => child !== this);
  });

  readonly spouses = computed<GedcomIndividual[]>(() => {
    return this.parentOfFamilies()
        .flatMap((family) => family.parents())
        .filter((parent) => parent !== this);
  });

  readonly children = computed<GedcomIndividual[]>(() => {
    return this.parentOfFamilies()
        .flatMap((family) => family.children());
  });

  readonly stepparents = computed<GedcomIndividual[]>(() => {
    return this.parents()
        .flatMap((parent)=> parent.spouses())
        .filter((stepparent) => !this.parents().includes(stepparent));
  });

  readonly stepsiblings = computed<GedcomIndividual[]>(() => {
    return this.parents()
        .flatMap((parent) => parent.children())
        .filter((stepsibling) => stepsibling !== this)
        .filter((stepsibling) => !this.siblings().includes(stepsibling));
  });

  readonly censusEvents = computed<GedcomEvent[]>(() => {
    return this.events.filter((gedcomEvent) => gedcomEvent.type === 'Census');
  });
};
