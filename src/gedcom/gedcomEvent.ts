import type { GedcomCitation } from "./gedcomCitation";

export interface GedcomEvent {
  tag: string;
  type?: string;
  address?: string;
  place?: string;
  cause?: string;
  date?: string;
  value?: string;
  citations: GedcomCitation[];
  sharedWithXrefs: string[];
}

export const gedcomEventTags = new Map([
  ["BAPM", "Baptism"],
  ["BIRT", "Birth"],
  ["BURI", "Burial"],
  ["CENS", "Census"],
  ["DEAT", "Death"],
  ["DIV", "Divorce"],
  ["EDUC", "Education"],
  ["EMIG", "Emigration"],
  ["EVEN", "Event"],
  ["IMMI", "Immigration"],
  ["MARB", "Marriage Banns"],
  ["MARR", "Marriage"],
  ["NAME", "Name"],
  ["NATU", "Naturalization"],
  ["OCCU", "Occupation"],
  ["PROB", "Probate"],
  ["RELI", "Religion"],
  ["RESI", "Residence"],
  ["RETI", "Retirement"],
  ["SEX", "Sex"],
  ["SSN", "Social Security Number"],
  ["WILL", "Will"],
]);
