import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomEvent(gedcomEvent: GedcomEvent): GedcomRecord {
  // TODO: Build something useful.
  return {
    tag: gedcomEvent.tag,
    abstag: "",
    children: [],
  };
}
