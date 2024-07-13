import {create, enforce, only, test} from 'vest';
import type {GedcomSource} from '../gedcom/gedcomSource';

export const sourceValidators = create((source: GedcomSource, field?: string) => {
  only(field); // If specified, limit tests to just this field.
  test('unknowns', 'Source has unknown records', () => {
    enforce(source.unknowns).isEmpty();
  });
  test('repositories', 'Source is not part of any repository', () => {
    enforce(source.repositories).isNotEmpty();
  });
  test('citations', 'Source is not used as a citation anywhere', () => {
    enforce(source.citations()).isNotEmpty();
  });
});
