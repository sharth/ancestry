import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomName } from "./gedcomName";
import type { GedcomSex } from "./gedcomSex";

export interface GedcomIndividual {
  xref: string;
  names: GedcomName[];
  events: GedcomEvent[];
  sex?: GedcomSex;
  familySearchId?: string;
}

export function fullname(gedcomIndividual: GedcomIndividual): string {
  const gedcomName = gedcomIndividual.names.at(0);
  if (gedcomName == null) return "";
  return [
    gedcomName.prefix,
    gedcomName.givenName,
    gedcomName.nickName,
    gedcomName.surnamePrefix,
    gedcomName.surname,
    gedcomName.suffix,
  ]
    .filter((part) => part != null)
    .join(" ");
}

export function surname(gedcomIndividual: GedcomIndividual): string {
  const gedcomName = gedcomIndividual.names.at(0);
  return gedcomName?.surname ?? "";
}
