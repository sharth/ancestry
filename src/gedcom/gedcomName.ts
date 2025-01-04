import type { GedcomCitation } from "./gedcomCitation";

export interface GedcomName {
  prefix?: string;
  givenName?: string;
  nickName?: string;
  surnamePrefix?: string;
  surname?: string;
  suffix?: string;
  nameType?: string;
  citations: GedcomCitation[];
}
