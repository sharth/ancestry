import {computed, Injectable, signal} from '@angular/core';
import {GedcomFamily} from '../gedcom/gedcomFamily';
import {GedcomIndividual} from '../gedcom/gedcomIndividual';
import {GedcomRepository} from '../gedcom/gedcomRepository';
import {GedcomSource} from '../gedcom/gedcomSource';
import {GedcomHeader} from '../gedcom/gedcomHeader';
import {GedcomTrailer} from '../gedcom/gedcomTrailer';
import {GedcomRecord} from '../gedcom/gedcomRecord';
import {Map as ImmutableMap} from 'immutable';
import {List as ImmutableList} from 'immutable';

@Injectable({providedIn: 'root'})
export class AncestryService {
  readonly headers = signal(ImmutableList<GedcomHeader>());
  readonly trailers = signal(ImmutableList<GedcomTrailer>());

  readonly individuals = signal(ImmutableMap<string, GedcomIndividual>({}));
  readonly families = signal(ImmutableMap<string, GedcomFamily>());
  readonly sources = signal(ImmutableMap<string, GedcomSource>());
  readonly repositories = signal(ImmutableMap<string, GedcomRepository>());

  private readonly unparsedTags = new Set<string>();

  individual(xref: string): GedcomIndividual {
    const individual = this.individuals().get(xref);
    if (individual == null) throw new Error(`No individual with xref '${xref}'`);
    return individual;
  }

  family(xref: string): GedcomFamily {
    const family = this.families().get(xref);
    if (family == null) throw new Error(`No family with xref '${xref}'`);
    return family;
  }

  repository(xref: string): GedcomRepository {
    const repository = this.repositories().get(xref);
    if (repository == null) throw new Error(`No repository with xref '${xref}`);
    return repository;
  }

  source(xref: string): GedcomSource {
    const source = this.sources().get(xref);
    if (source == null) throw new Error(`No source with xref '${xref}`);
    return source;
  }

  gedcomRecords = computed<GedcomRecord[]>(() => {
    return Array.from([
      ...this.headers(),
      ...this.individuals().values(),
      ...this.families().values(),
      ...this.sources().values(),
      ...this.repositories().values(),
      ...this.trailers(),
    ], (gedcomObject) => gedcomObject.gedcomRecord());
  });

  parseText(text: string) {
    const lines = text.split(/\r?\n/);
    let ladder: GedcomRecord[] = [];

    for (const line of lines) {
      if (line == '') {
        continue;
      }
      const match = line.match(/^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.+)?$/);
      if (match == null) {
        throw new Error();
      }
      const level = parseInt(match[1], 10);
      const [xref, tag, value] = match.slice(2);
      const abstag = [...ladder.slice(0, level).map((record) => record.tag), tag].join('.');
      const record = new GedcomRecord(level, xref, tag, abstag, value);

      if (record.level === 0) {
        if (ladder.length > 0) {
          this.parseRecord(ladder[0]);
        }
        ladder = [record];
      } else if (record.tag === 'CONC') {
        ladder.at(-1)!.value! += record.value;
      } else if (record.tag === 'CONT') {
        ladder.at(-1)!.value! += '\n' + (record.value ?? '');
      } else {
        ladder.length = record.level;
        ladder.at(-1)!.children.push(record);
        ladder.push(record);
      }
    }
    if (ladder.length > 0) {
      this.parseRecord(ladder[0]);
    }
  }

  parseRecord(gedcomRecord: GedcomRecord): void {
    const reportUnparsedRecord = this.reportUnparsedRecord.bind(this);
    switch (gedcomRecord.tag) {
      case 'HEAD': {
        const gedcomHeader = new GedcomHeader(gedcomRecord);
        this.headers.update((headers) => headers.push(gedcomHeader));
        break;
      }
      case 'TRLR': {
        const gedcomTrailer = new GedcomTrailer(gedcomRecord);
        this.trailers.update((trailers) => trailers.push(gedcomTrailer));
        break;
      }
      case 'INDI': {
        const gedcomIndividual = new GedcomIndividual(gedcomRecord, this);
        this.individuals.update(
            (individuals) => individuals.set(gedcomIndividual.xref, gedcomIndividual));
        break;
      }
      case 'FAM': {
        const gedcomFamily = new GedcomFamily(gedcomRecord, this);
        this.families.update(
            (families) => families.set(gedcomFamily.xref, gedcomFamily));
        break;
      }
      case 'REPO': {
        const gedcomRepository = new GedcomRepository(gedcomRecord, this);
        this.repositories.update(
            (repositories) => repositories.set(gedcomRepository.xref, gedcomRepository ));
        break;
      }
      case 'SOUR': {
        const gedcomSource = new GedcomSource(gedcomRecord, this);
        this.sources.update(
            (sources) => sources.set(gedcomSource.xref, gedcomSource));
        break;
      }
      default:
        this.reportUnparsedRecord(gedcomRecord);
        break;
    }
  }

  reportUnparsedRecord(gedcomRecord: GedcomRecord): void {
    if (!this.unparsedTags.has(gedcomRecord.abstag)) {
      console.warn('Unparsed tag ', gedcomRecord.abstag);
      this.unparsedTags.add(gedcomRecord.abstag);
    }
  }

  reset(): void {
    this.headers.set(ImmutableList<GedcomHeader>());
    this.trailers.set(ImmutableList<GedcomTrailer>());
    this.individuals.set(ImmutableMap<string, GedcomIndividual>({}));
    this.families.set(ImmutableMap<string, GedcomFamily>());
    this.sources.set(ImmutableMap<string, GedcomSource>());
    this.repositories .set(ImmutableMap<string, GedcomRepository>());
  }
}
