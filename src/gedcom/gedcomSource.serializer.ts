import {GedcomRecord} from './gedcomRecord';
import type {GedcomSource} from './gedcomSource';

export function serializeSourceToGedcomRecord(source: GedcomSource): GedcomRecord {
  return new GedcomRecord(
      0, source.xref, 'SOUR', 'SOUR', undefined,
      [
        source.abbr ? new GedcomRecord(1, undefined, 'ABBR', 'SOUR.ABBR', source.abbr, []): null,
        source.title ? new GedcomRecord(1, undefined, 'TITL', 'SOUR.TITL', source.title, []) : null,
        source.text ? new GedcomRecord(1, undefined, 'TEXT', 'SOUR.TEXT', source.text, []) : null,
        ...source.repositories.map((repositoryCitation) =>new GedcomRecord(
            1, undefined, 'REPO', 'SOUR.REPO', repositoryCitation.repositoryXref,
            repositoryCitation.callNumbers.map((callNumber) => new GedcomRecord(
                2, undefined, 'CALN', 'SOUR.REPO.CALN', callNumber, [])))),
        ...source.unknowns.map((unknown) => unknown.gedcomRecord()),
      ].filter((record) => record !== null));
}
