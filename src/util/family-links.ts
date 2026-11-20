import { produce } from "immer";

import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomFamily } from "../gedcom/gedcomFamily";

// GEDCOM stores family membership on both sides: a family's HUSB/WIFE/CHIL
// and each individual's FAMS/FAMC. The family is the side that's edited, so
// this brings FAMS/FAMC in `edited` back in line with its families, for
// every family whose members differ from `original` (including families
// added to or removed from `edited`). Individuals whose links don't change
// keep their identity, so they aren't treated as edited.
export function syncFamilyLinks(
  original: GedcomDatabase,
  edited: GedcomDatabase,
): GedcomDatabase {
  const familyXrefs = new Set([
    ...Object.keys(original.families),
    ...Object.keys(edited.families),
  ]);
  return produce(edited, (draft) => {
    for (const familyXref of familyXrefs) {
      const before = original.families[familyXref];
      const after = edited.families[familyXref];
      if (before === after) continue;

      const spousesBefore = spouseXrefs(before);
      const spousesAfter = spouseXrefs(after);
      const childrenBefore = new Set(before?.childXrefs);
      const childrenAfter = new Set(after?.childXrefs);

      for (const xref of spousesBefore.difference(spousesAfter)) {
        const individual = draft.individuals[xref];
        if (individual?.parentOfFamilyXrefs.includes(familyXref)) {
          individual.parentOfFamilyXrefs =
            individual.parentOfFamilyXrefs.filter((x) => x !== familyXref);
        }
      }
      for (const xref of spousesAfter) {
        const individual = draft.individuals[xref];
        if (
          individual &&
          !individual.parentOfFamilyXrefs.includes(familyXref)
        ) {
          individual.parentOfFamilyXrefs.push(familyXref);
        }
      }
      for (const xref of childrenBefore.difference(childrenAfter)) {
        const individual = draft.individuals[xref];
        if (individual?.childOfFamilyXrefs.includes(familyXref)) {
          individual.childOfFamilyXrefs = individual.childOfFamilyXrefs.filter(
            (x) => x !== familyXref,
          );
        }
      }
      for (const xref of childrenAfter) {
        const individual = draft.individuals[xref];
        if (individual && !individual.childOfFamilyXrefs.includes(familyXref)) {
          individual.childOfFamilyXrefs.push(familyXref);
        }
      }
    }
  });
}

function spouseXrefs(family: GedcomFamily | undefined): Set<string> {
  return new Set(
    [family?.husbandXref, family?.wifeXref].filter(
      (xref): xref is string => !!xref,
    ),
  );
}
