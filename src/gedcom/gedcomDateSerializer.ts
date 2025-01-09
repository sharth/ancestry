import type { GedcomDate } from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomDate(gedcomDate: GedcomDate): GedcomRecord {
  return {
    tag: "DATE",
    abstag: "",
    value: gedcomDate.value,
    children: [],
  };
}

export function serializeGedcomSortDate(gedcomDate: GedcomDate): GedcomRecord {
  return {
    tag: "SDATE",
    abstag: "",
    value: gedcomDate.value,
    children: [],
  };
}
