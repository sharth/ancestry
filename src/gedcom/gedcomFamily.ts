import {computed} from '@angular/core';
import type {AncestryService} from '../app/ancestry.service';
import type {GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomFamily {
  constructor(
    public xref: string,
    public gedcomRecord: GedcomRecord,
    private ancestryService: AncestryService) { }

  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[] = [];
  events: GedcomEvent[] = [];

  get parentXrefs(): string[] {
    return [this.husbandXref, this.wifeXref].filter((e): e is NonNullable<typeof e> => e != null);
  }

  husband = computed(() => {
    if (this.husbandXref) {
      return this.ancestryService.individual(this.husbandXref);
    } else {
      return undefined;
    }
  });

  wife = computed(() => {
    if (this.wifeXref) {
      return this.ancestryService.individual(this.wifeXref);
    } else {
      return undefined;
    }
  });

  parents = computed(() => this.parentXrefs
      .map((xref) => this.ancestryService.individual(xref)));

  children = computed(() => this.childXrefs
      .map((xref) => this.ancestryService.individual(xref)));
};
