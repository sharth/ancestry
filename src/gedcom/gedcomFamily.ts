import type { Immutable } from "immer";

import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  newGedcomChangeDate,
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  newGedcomCreationDate,
  parseGedcomCreationDate,
  serializeGedcomCreationDate,
  type GedcomCreationDate,
} from "./gedcomCreationDate";
import { sortChronologically } from "./gedcomDateSort";
import {
  parseGedcomFamilyEvent,
  serializeGedcomFamilyFact,
  type GedcomFact,
} from "./gedcomFact";
import { gedcomFamilyFacts } from "./gedcomFactMetadata";
import {
  filterTrivialGedcomRecords,
  gedcomRecordsEqual,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  parseGedcomSourceCitation,
  serializeGedcomSourceCitation,
  type GedcomSourceCitation,
} from "./gedcomSourceCitation";

export interface GedcomFamily {
  xref: string;
  husbandXref: string;
  wifeXref: string;
  childXrefs: string[];
  facts: GedcomFact[];
  citations: GedcomSourceCitation[];
  changeDate: GedcomChangeDate;
  creationDate: GedcomCreationDate;
  unknownRecords: GedcomRecord[];
}

export function newGedcomFamily(
  fieldsToUpdate: Partial<GedcomFamily> & Pick<GedcomFamily, "xref">,
): GedcomFamily {
  return {
    husbandXref: "",
    wifeXref: "",
    childXrefs: [],
    facts: [],
    citations: [],
    changeDate: newGedcomChangeDate(),
    creationDate: newGedcomCreationDate(),
    unknownRecords: [],
    ...fieldsToUpdate,
  };
}

export function parseGedcomFamily(record: GedcomRecord): GedcomFamily {
  if (record.tag !== "FAM") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomFamily = newGedcomFamily({
    xref: record.xref,
  });

  for (const childRecord of record.children) {
    const metadata = gedcomFamilyFacts[childRecord.tag];
    if (metadata !== undefined) {
      gedcomFamily.facts.push(parseGedcomFamilyEvent(childRecord));
      continue;
    }
    switch (childRecord.tag) {
      case "CHIL":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.childXrefs.push(childRecord.value);
        break;
      case "HUSB":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.husbandXref = childRecord.value;
        break;
      case "WIFE":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomFamily.wifeXref = childRecord.value;
        break;
      case "SOUR":
        gedcomFamily.citations.push(parseGedcomSourceCitation(childRecord));
        break;
      case "CHAN":
        gedcomFamily.changeDate = parseGedcomChangeDate(childRecord);
        break;
      case "CREA":
        gedcomFamily.creationDate = parseGedcomCreationDate(childRecord);
        break;
      default:
        gedcomFamily.unknownRecords.push(childRecord);
        break;
    }
  }

  // Seed the serialization cache. When the family serializes back to
  // exactly the record it was parsed from, cache that record itself, so
  // comparing an unedited family against the file is an identity check.
  const serialized = serializeGedcomFamily(gedcomFamily);
  serializedFamilies.set(
    gedcomFamily,
    gedcomRecordsEqual(serialized, record) ? record : serialized,
  );

  return gedcomFamily;
}

// Each family's serialization, by object. Families are only ever changed
// through immer, which makes a new object for an edited one and keeps an
// unedited one as the same object, so a cached serialization never goes
// stale. See serializeGedcomIndividual.
const serializedFamilies = new WeakMap<Immutable<GedcomFamily>, GedcomRecord>();

export function serializeGedcomFamily(
  gedcomFamily: Immutable<GedcomFamily>,
): GedcomRecord {
  return serializedFamilies.getOrInsertComputed(gedcomFamily, () =>
    newGedcomRecord({
      tag: "FAM",
      xref: gedcomFamily.xref,
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "HUSB",
          value: gedcomFamily.husbandXref,
        }),
        newGedcomRecord({
          tag: "WIFE",
          value: gedcomFamily.wifeXref,
        }),
        ...gedcomFamily.childXrefs.map((childXref) =>
          newGedcomRecord({
            tag: "CHIL",
            value: childXref,
          }),
        ),
        ...gedcomFamily.citations.map((citation) =>
          serializeGedcomSourceCitation(citation),
        ),
        ...sortChronologically(gedcomFamily.facts).map((event) =>
          serializeGedcomFamilyFact(event),
        ),
        serializeGedcomChangeDate(gedcomFamily.changeDate),
        serializeGedcomCreationDate(gedcomFamily.creationDate),
        ...gedcomFamily.unknownRecords,
      ]),
    }),
  );
}

export function getFamilyMultimediaCitations(
  family: Immutable<GedcomFamily>,
  multimediaXref: string,
): { event: string; citation: Immutable<GedcomSourceCitation> }[] {
  const references: {
    event: string;
    citation: Immutable<GedcomSourceCitation>;
  }[] = [];

  for (const event of family.facts) {
    for (const citation of event.citations) {
      if (
        citation.multimediaLinks.some((link) => link.xref === multimediaXref)
      ) {
        references.push({ event: event.tag, citation });
      }
    }
  }

  for (const citation of family.citations) {
    if (citation.multimediaLinks.some((link) => link.xref === multimediaXref)) {
      references.push({ event: "FAM", citation });
    }
  }

  return references;
}

export function getFamilySourceCitations(
  family: Immutable<GedcomFamily>,
): { event: string; citation: Immutable<GedcomSourceCitation> }[] {
  const references: {
    event: string;
    citation: Immutable<GedcomSourceCitation>;
  }[] = [];

  for (const event of family.facts) {
    for (const citation of event.citations) {
      references.push({ event: event.tag, citation });
    }
  }

  for (const citation of family.citations) {
    references.push({ event: "FAM", citation });
  }

  return references;
}
