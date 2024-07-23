import {computed} from '@angular/core';
import {ancestryService} from '../app/ancestry.service';
import type {GedcomRecord} from './gedcomRecord';
import type {GedcomSource} from './gedcomSource';

export class GedcomRepository {
  constructor(private record: GedcomRecord) {
    if (record.abstag !== 'REPO') throw new Error();
    if (record.xref == null) throw new Error();
    if (record.value != null) throw new Error();

    this.xref = record.xref;

    for (const childRecord of record.children) {
      switch (childRecord.tag) {
        case 'NAME':
          if (childRecord.abstag !== 'REPO.NAME') throw new Error();
          if (childRecord.xref != null) throw new Error();
          if (childRecord.value == null) throw new Error();
          if (childRecord.children.length != 0) throw new Error();
          this.name = childRecord.value;
          break;

        default:
          ancestryService.reportUnparsedRecord(childRecord);
          break;
      }
    }
  }

  xref: string;
  name?: string;

  sources = computed<GedcomSource[]>(() => {
    const sources: GedcomSource[] = [];
    const xref = this.xref;
    for (const source of ancestryService.sources().values()) {
      if (source.repositoryCitations.map((repositoryCitation) => repositoryCitation.repositoryXref).includes(xref)) {
        sources.push(source);
      }
    }
    return sources;
  });

  gedcomRecord(): GedcomRecord {
    return this.record;
  }
};
