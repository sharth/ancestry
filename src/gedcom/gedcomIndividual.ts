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
  parseGedcomFact,
  serializeGedcomIndividualFact,
  type GedcomFact,
} from "./gedcomFact";
import { gedcomIndividualFacts } from "./gedcomFactMetadata";
import {
  parseGedcomName,
  serializeGedcomName,
  type GedcomName,
} from "./gedcomName";
import {
  parseGedcomNote,
  serializeGedcomNote,
  type GedcomNote,
} from "./gedcomNote";
import {
  filterTrivialGedcomRecords,
  gedcomRecordsEqual,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";
import {
  newGedcomSex,
  parseGedcomSex,
  serializeGedcomSex,
  type GedcomSex,
} from "./gedcomSex";
import type { GedcomSourceCitation } from "./gedcomSourceCitation";

export interface GedcomIndividual {
  xref: string;
  names: GedcomName[];
  facts: GedcomFact[];
  sex: GedcomSex;
  changeDate: GedcomChangeDate;
  creationDate: GedcomCreationDate;
  childOfFamilyXrefs: string[];
  parentOfFamilyXrefs: string[];
  notes: GedcomNote[];
  unknownRecords: GedcomRecord[];
}

export function newGedcomIndividual(
  fieldsToUpdate: Partial<GedcomIndividual> & Pick<GedcomIndividual, "xref">,
): GedcomIndividual {
  return {
    names: [],
    sex: newGedcomSex(),
    facts: [],
    parentOfFamilyXrefs: [],
    childOfFamilyXrefs: [],
    unknownRecords: [],
    notes: [],
    changeDate: newGedcomChangeDate(),
    creationDate: newGedcomCreationDate(),
    ...fieldsToUpdate,
  };
}

export function nameToString(gedcomName: Immutable<GedcomName>): string {
  return [
    gedcomName.prefix,
    gedcomName.givenName,
    gedcomName.nickName,
    gedcomName.surnamePrefix,
    gedcomName.surname,
    gedcomName.suffix,
  ]
    .filter((part) => part != "")
    .join(" ");
}

export function fullname(
  gedcomIndividual: Immutable<GedcomIndividual>,
): string {
  const gedcomName = gedcomIndividual.names.at(0);
  if (gedcomName == null) return "";
  return nameToString(gedcomName);
}

export function surname(gedcomIndividual: Immutable<GedcomIndividual>): string {
  const gedcomName = gedcomIndividual.names.at(0);
  return gedcomName?.surname ?? "";
}

export function parseGedcomIndividual(record: GedcomRecord): GedcomIndividual {
  if (record.tag !== "INDI") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomIndividual = newGedcomIndividual({
    xref: record.xref,
  });

  for (const childRecord of record.children) {
    const metadata = gedcomIndividualFacts[childRecord.tag];
    if (metadata !== undefined) {
      gedcomIndividual.facts.push(parseGedcomFact(childRecord, metadata));
      continue;
    }
    switch (childRecord.tag) {
      case "NAME":
        gedcomIndividual.names.push(parseGedcomName(childRecord));
        break;
      case "SEX":
        gedcomIndividual.sex = parseGedcomSex(childRecord);
        break;
      case "FAMS":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomIndividual.parentOfFamilyXrefs.push(childRecord.value);
        break;
      case "FAMC":
        if (childRecord.xref != "") throw new Error();
        if (childRecord.value == "") throw new Error();
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomIndividual.childOfFamilyXrefs.push(childRecord.value);
        break;
      case "CHAN":
        gedcomIndividual.changeDate = parseGedcomChangeDate(childRecord);
        break;
      case "CREA":
        gedcomIndividual.creationDate = parseGedcomCreationDate(childRecord);
        break;
      case "NOTE":
        gedcomIndividual.notes.push(parseGedcomNote(childRecord));
        break;
      default:
        gedcomIndividual.unknownRecords.push(childRecord);
        break;
    }
  }

  // Seed the serialization cache. When the individual serializes back to
  // exactly the record it was parsed from, cache that record itself, so
  // comparing an unedited individual against the file is an identity check.
  const serialized = serializeGedcomIndividual(gedcomIndividual);
  serializedIndividuals.set(
    gedcomIndividual,
    gedcomRecordsEqual(serialized, record) ? record : serialized,
  );

  return gedcomIndividual;
}

// Each individual's serialization, by object. Individuals are only ever
// changed through immer, which makes a new object for an edited individual
// and keeps an unedited one as the same object, so a cached serialization
// never goes stale. A WeakMap lets an entry go once its individual is no
// longer referenced.
const serializedIndividuals = new WeakMap<
  Immutable<GedcomIndividual>,
  Immutable<GedcomRecord>
>();

export function serializeGedcomIndividual(
  gedcomIndividual: Immutable<GedcomIndividual>,
): Immutable<GedcomRecord> {
  return serializedIndividuals.getOrInsertComputed(gedcomIndividual, () =>
    newGedcomRecord({
      xref: gedcomIndividual.xref,
      tag: "INDI",
      children: filterTrivialGedcomRecords([
        ...gedcomIndividual.names.map((name) => serializeGedcomName(name)),
        serializeGedcomSex(gedcomIndividual.sex),
        ...gedcomIndividual.unknownRecords.filter(
          (record) => record.tag == "_UID",
        ),
        ...gedcomIndividual.unknownRecords.filter(
          (record) => record.tag == "_FSFTID",
        ),
        ...gedcomIndividual.unknownRecords.filter(
          (record) => record.tag == "_AMTID",
        ),
        serializeGedcomChangeDate(gedcomIndividual.changeDate),
        serializeGedcomCreationDate(gedcomIndividual.creationDate),
        ...gedcomIndividual.unknownRecords.filter(
          (record) => record.tag == "SOUR",
        ),
        ...sortChronologically(gedcomIndividual.facts).map((event) =>
          serializeGedcomIndividualFact(event),
        ),
        ...gedcomIndividual.parentOfFamilyXrefs.map((xref) =>
          newGedcomRecord({ tag: "FAMS", value: xref }),
        ),
        ...gedcomIndividual.childOfFamilyXrefs.map((xref) =>
          newGedcomRecord({ tag: "FAMC", value: xref }),
        ),
        ...gedcomIndividual.notes.map((gedcomNote) =>
          serializeGedcomNote(gedcomNote),
        ),
        ...gedcomIndividual.unknownRecords.filter(
          (record) =>
            record.tag != "_UID" &&
            record.tag != "_FSFTID" &&
            record.tag != "_AMTID" &&
            record.tag != "SOUR",
        ),
      ]),
    }),
  );
}

export function getIndividualMultimediaCitations(
  individual: Immutable<GedcomIndividual>,
  multimediaXref: string,
): { event: string; citation: Immutable<GedcomSourceCitation> }[] {
  const references: {
    event: string;
    citation: Immutable<GedcomSourceCitation>;
  }[] = [];

  for (const event of individual.facts) {
    for (const citation of event.citations) {
      if (
        citation.multimediaLinks.some((link) => link.xref === multimediaXref)
      ) {
        references.push({ event: event.tag, citation });
      }
    }
  }

  for (const citation of individual.sex.citations) {
    if (citation.multimediaLinks.some((link) => link.xref === multimediaXref)) {
      references.push({ event: "SEX", citation });
    }
  }

  for (const name of individual.names) {
    for (const citation of name.citations) {
      if (
        citation.multimediaLinks.some((link) => link.xref === multimediaXref)
      ) {
        references.push({ event: "NAME", citation });
      }
    }
  }

  return references;
}

export function getIndividualSourceCitations(
  individual: Immutable<GedcomIndividual>,
): {
  event: string;
  citation: Immutable<GedcomSourceCitation>;
  nameText?: string;
}[] {
  const references: {
    event: string;
    citation: Immutable<GedcomSourceCitation>;
    nameText?: string;
  }[] = [];

  for (const event of individual.facts) {
    for (const citation of event.citations) {
      references.push({ event: event.tag, citation });
    }
  }

  for (const citation of individual.sex.citations) {
    references.push({ event: "SEX", citation });
  }

  for (const name of individual.names) {
    for (const citation of name.citations) {
      references.push({
        event: "NAME",
        citation,
        nameText: nameToString(name),
      });
    }
  }

  return references;
}
