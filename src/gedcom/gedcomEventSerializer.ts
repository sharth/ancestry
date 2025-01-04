import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomEvent(gedcomEvent: GedcomEvent): GedcomRecord {
  if (gedcomEvent.gedcomRecord) {
    return gedcomEvent.gedcomRecord;
  } else {
    // TODO: Build something useful.
    return {
      tag: "EVEN",
      abstag: "EVEN",
      children: [],
    };
  }
}
