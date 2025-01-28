import type { GedcomCitation } from "./gedcomCitation";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomCitation(
  gedcomCitation: GedcomCitation
): GedcomRecord {
  return {
    tag: "SOUR",
    abstag: "",
    value: gedcomCitation.sourceXref,
    children: [
      { tag: "OBJE", abstag: "", value: gedcomCitation.obje, children: [] },
      { tag: "NAME", abstag: "", value: gedcomCitation.name, children: [] },
      { tag: "NOTE", abstag: "", value: gedcomCitation.note, children: [] },
      { tag: "PAGE", abstag: "", value: gedcomCitation.page, children: [] },
      { tag: "QUAY", abstag: "", value: gedcomCitation.quality, children: [] },
      {
        tag: "DATA",
        abstag: "",
        children: [
          { tag: "TEXT", abstag: "", value: gedcomCitation.text, children: [] },
        ].filter((record) => record.children.length || record.value),
      },
    ].filter((record) => record.children.length || record.value),
  };
}
