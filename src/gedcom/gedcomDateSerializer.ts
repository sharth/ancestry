import type { GedcomDate } from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomDate(
  tag: string,
  gedcomDate: GedcomDate
): GedcomRecord {
  return { tag, abstag: "", value: gedcomDate.value, children: [] };
}
