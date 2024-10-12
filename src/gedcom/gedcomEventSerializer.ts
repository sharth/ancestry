import type { GedcomEvent } from "./gedcomEvent";
import { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomEvent(gedcomEvent: GedcomEvent): GedcomRecord {
  if (gedcomEvent.gedcomRecord) {
    return gedcomEvent.gedcomRecord;
  } else {
    // TODO: Build something useful.
    return new GedcomRecord(undefined, "EVEN", "EVEN", undefined, []);
  }
}
