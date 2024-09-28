import { assert } from 'chai';
import * as gedcom from '../gedcom';
import { serializeGedcomRecordToText } from './gedcom-serializer';

describe('GedcomRecord Serializing', () => {
    it('serialize individual', () => {
      const gedcomRecord = new gedcom.GedcomRecord(0, '@I1@', 'INDI', 'INDI', undefined, [
        new gedcom.GedcomRecord(1, undefined, 'NAME', 'INDI.NAME', 'john doe \n senior', [])
      ]);
      assert.deepEqual(serializeGedcomRecordToText(gedcomRecord), [
        '0 @I1@ INDI',
        '1 NAME john doe ',
        '2 CONT  senior',
      ]); 
    });
  });