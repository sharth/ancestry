import { serializeGedcomCitation } from "./gedcomCitationSerializer";
import { serializeGedcomDate } from "./gedcomDateSerializer";
import type { GedcomEvent } from "./gedcomEvent";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomEvent(gedcomEvent: GedcomEvent): GedcomRecord {
  return {
    tag: gedcomEvent.tag,
    abstag: "",
    value: gedcomEvent.value,
    children: [
      gedcomEvent.date ? serializeGedcomDate("DATE", gedcomEvent.date) : null,
      gedcomEvent.sortDate
        ? serializeGedcomDate("SDATE", gedcomEvent.sortDate)
        : null,
      { tag: "PLAC", abstag: "", value: gedcomEvent.place, children: [] },
      { tag: "ADDR", abstag: "", value: gedcomEvent.address, children: [] },
      { tag: "CAUS", abstag: "", value: gedcomEvent.cause, children: [] },
      ...gedcomEvent.citations.map((c) => serializeGedcomCitation(c)),
    ]
      .filter((r) => r != null)
      .filter((r) => r.children.length || r.value),
  };
}
