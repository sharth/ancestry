import type { GedcomCitation } from "./gedcomCitation";
import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export class GedcomIndividual {
  constructor(public xref: string) {}

  names: GedcomIndividualName[] = [];
  events: GedcomEvent[] = [];
  sex?: "Male" | "Female";
  familySearchId?: string;

  gedcomRecord?: GedcomRecord;
}

export class GedcomIndividualName {
  namePrefix?: string;
  givenName?: string;
  nickName?: string;
  surnamePrefix?: string;
  surname?: string;
  nameSuffix?: string;
  nameType?: string;
  citations: GedcomCitation[] = [];
}

export function fullname(gedcomIndividual: GedcomIndividual): string {
  const gedcomIndividualName = gedcomIndividual.names.at(0);
  if (gedcomIndividualName == null) return "";
  return [
    gedcomIndividualName.namePrefix,
    gedcomIndividualName.givenName,
    gedcomIndividualName.nickName,
    gedcomIndividualName.surnamePrefix,
    gedcomIndividualName.surname,
    gedcomIndividualName.nameSuffix,
  ]
    .filter((part) => part != null)
    .join(" ");
}

export function surname(gedcomIndividual: GedcomIndividual): string {
  const gedcomIndividualName = gedcomIndividual.names.at(0);
  return gedcomIndividualName?.surname ?? "";
}
