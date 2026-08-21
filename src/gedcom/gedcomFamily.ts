import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomFamilyEvent,
  serializeGedcomFamilyFact,
  type GedcomFact,
} from "./gedcomFact";
import {
  filterTrivialGedcomRecords,
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
}

export function parseGedcomFamily(record: GedcomRecord): GedcomFamily {
  if (record.abstag !== "FAM") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomFamily = newGedcomFamily({
    xref: record.xref,
  });

  for (const childRecord of record.children) {
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
      case "DIV":
      case "EVEN":
      case "MARR":
      case "MARB":
        gedcomFamily.facts.push(parseGedcomFamilyEvent(childRecord));
        break;
      case "SOUR":
        gedcomFamily.citations.push(parseGedcomSourceCitation(childRecord));
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomFamily;
}

export function serializeGedcomFamily(
  gedcomFamily: GedcomFamily,
): GedcomRecord {
  return newGedcomRecord({
    tag: "FAM",
    abstag: "FAM",
    xref: gedcomFamily.xref,
    children: filterTrivialGedcomRecords([
      newGedcomRecord({
        tag: "HUSB",
        abstag: "FAM.HUSB",
        value: gedcomFamily.husbandXref,
      }),
      newGedcomRecord({
        tag: "WIFE",
        abstag: "FAM.WIFE",
        value: gedcomFamily.wifeXref,
      }),
      ...gedcomFamily.childXrefs.map((childXref) =>
        newGedcomRecord({
          tag: "CHIL",
          abstag: "FAM.CHIL",
          value: childXref,
        }),
      ),
      ...gedcomFamily.citations.map((citation) =>
        serializeGedcomSourceCitation(citation),
      ),
      ...gedcomFamily.facts.map((event) => serializeGedcomFamilyFact(event)),
    ]),
  });
}

export function getFamilyMultimediaCitations(
  family: GedcomFamily,
  multimediaXref: string,
): { event: string; citation: GedcomSourceCitation }[] {
  const references: { event: string; citation: GedcomSourceCitation }[] = [];

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

export function newGedcomFamily(
  fieldsToUpdate: Partial<GedcomFamily> & Pick<GedcomFamily, "xref">,
): GedcomFamily {
  return {
    husbandXref: "",
    wifeXref: "",
    childXrefs: [],
    facts: [],
    citations: [],
    ...fieldsToUpdate,
  };
}
