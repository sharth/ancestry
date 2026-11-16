import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";

/** How `targetXref` is related to `rootXref`, from the root's side: the
 * target is the root's "grandfather", "great-aunt", "first cousin once
 * removed", and so on. Blood relationships are found through shared
 * ancestors (or a shared family, when the parents aren't recorded), and a
 * spouse is named as such. "self" when they're the same person, undefined
 * when either is missing or no relationship is found. */
export function describeRelationship(
  gedcomDatabase: GedcomDatabase,
  rootXref: string,
  targetXref: string,
): string | undefined {
  const root = gedcomDatabase.individuals[rootXref];
  const target = gedcomDatabase.individuals[targetXref];
  if (root === undefined || target === undefined) {
    return undefined;
  }
  if (rootXref === targetXref) {
    return "self";
  }

  const sex = target.sex.sex;
  if (isSpouse(gedcomDatabase, root, targetXref)) {
    return gendered(sex, "husband", "wife", "spouse");
  }

  const generations = closestCommonAncestry(gedcomDatabase, root, target);
  if (generations === undefined) {
    return undefined;
  }
  return relationshipName(generations.root, generations.target, sex, {
    half: generations.half,
  });
}

/** The name of a blood relationship where the closest common ancestor is
 * `rootGenerations` above the root and `targetGenerations` above the
 * target. `half` marks one shared parent rather than a shared couple. */
export function relationshipName(
  rootGenerations: number,
  targetGenerations: number,
  sex: string,
  { half = false }: { half?: boolean } = {},
): string {
  // "half-aunt", but "half 2nd great-aunt".
  const halfPrefix = (term: string) =>
    !half ? term : /^\d/.test(term) ? `half ${term}` : `half-${term}`;

  if (rootGenerations === 0 && targetGenerations === 0) {
    return "self";
  }
  if (rootGenerations === 0) {
    // The target descends from the root.
    if (targetGenerations === 1) {
      return gendered(sex, "son", "daughter", "child");
    }
    return (
      greats(targetGenerations - 2) +
      gendered(sex, "grandson", "granddaughter", "grandchild")
    );
  }
  if (targetGenerations === 0) {
    // The target is the root's ancestor.
    if (rootGenerations === 1) {
      return gendered(sex, "father", "mother", "parent");
    }
    return (
      greats(rootGenerations - 2) +
      gendered(sex, "grandfather", "grandmother", "grandparent")
    );
  }
  if (rootGenerations === 1 && targetGenerations === 1) {
    return halfPrefix(gendered(sex, "brother", "sister", "sibling"));
  }
  if (rootGenerations === 1) {
    // The target descends from the root's sibling.
    return halfPrefix(
      greats(targetGenerations - 2) +
        gendered(sex, "nephew", "niece", "niece or nephew"),
    );
  }
  if (targetGenerations === 1) {
    // The target is a sibling of the root's ancestor.
    return halfPrefix(
      greats(rootGenerations - 2) +
        gendered(sex, "uncle", "aunt", "aunt or uncle"),
    );
  }

  const degree = Math.min(rootGenerations, targetGenerations) - 1;
  const removed = Math.abs(rootGenerations - targetGenerations);
  const cousin = `${half ? "half " : ""}${ordinal(degree)} cousin`;
  return removed === 0 ? cousin : `${cousin} ${timesRemoved(removed)}`;
}

function gendered(
  sex: string,
  male: string,
  female: string,
  neutral: string,
): string {
  return sex === "M" ? male : sex === "F" ? female : neutral;
}

// "", "great-", "2nd great-", "3rd great-", ...
function greats(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "great-";
  return `${ordinalNumber(count)} great-`;
}

function ordinalNumber(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

const ORDINAL_WORDS = [
  "",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

function ordinal(n: number): string {
  return ORDINAL_WORDS[n] ?? ordinalNumber(n);
}

const TIMES_WORDS = [
  "",
  "once",
  "twice",
  "three times",
  "four times",
  "five times",
  "six times",
  "seven times",
  "eight times",
  "nine times",
  "ten times",
];

function timesRemoved(n: number): string {
  return `${TIMES_WORDS[n] ?? `${n} times`} removed`;
}

function isSpouse(
  gedcomDatabase: GedcomDatabase,
  root: GedcomIndividual,
  targetXref: string,
): boolean {
  return root.parentOfFamilyXrefs.some((familyXref) => {
    const family = gedcomDatabase.families[familyXref];
    return (
      family !== undefined &&
      (family.husbandXref === targetXref || family.wifeXref === targetXref)
    );
  });
}

interface Ancestry {
  // Each ancestor, the individual included at 0, by how many generations up
  // it is (the fewest, if there's more than one line).
  individuals: Map<string, number>;
  // Each family an ancestor (or the individual) is a child of, by the
  // generation of its parents: 1 for the individual's own parents.
  families: Map<string, number>;
}

function ancestry(
  gedcomDatabase: GedcomDatabase,
  individual: GedcomIndividual,
): Ancestry {
  const individuals = new Map<string, number>([[individual.xref, 0]]);
  const families = new Map<string, number>();
  // Breadth first, so each is first reached by its shortest line.
  let generation = [individual];
  for (let depth = 1; generation.length > 0; depth++) {
    const nextGeneration: GedcomIndividual[] = [];
    for (const child of generation) {
      for (const familyXref of child.childOfFamilyXrefs) {
        if (families.has(familyXref)) continue;
        families.set(familyXref, depth);
        const family = gedcomDatabase.families[familyXref];
        if (family === undefined) continue;
        for (const parentXref of [family.husbandXref, family.wifeXref]) {
          const parent = gedcomDatabase.individuals[parentXref];
          if (parent === undefined || individuals.has(parentXref)) continue;
          individuals.set(parentXref, depth);
          nextGeneration.push(parent);
        }
      }
    }
    generation = nextGeneration;
  }
  return { individuals, families };
}

// The generations up from the root and from the target to their closest
// common ancestor. A shared family (both parents, or whichever are recorded)
// is a full relationship; sharing only one parent at the closest distance
// makes it a half relationship.
function closestCommonAncestry(
  gedcomDatabase: GedcomDatabase,
  root: GedcomIndividual,
  target: GedcomIndividual,
): { root: number; target: number; half: boolean } | undefined {
  const rootAncestry = ancestry(gedcomDatabase, root);
  const targetAncestry = ancestry(gedcomDatabase, target);

  const closest = (
    rootGenerations: Map<string, number>,
    targetGenerations: Map<string, number>,
  ) => {
    let best: { root: number; target: number } | undefined;
    for (const [xref, rootDepth] of rootGenerations) {
      const targetDepth = targetGenerations.get(xref);
      if (targetDepth === undefined) continue;
      if (
        best === undefined ||
        rootDepth + targetDepth < best.root + best.target
      ) {
        best = { root: rootDepth, target: targetDepth };
      }
    }
    return best;
  };

  const viaFamily = closest(rootAncestry.families, targetAncestry.families);
  const viaIndividual = closest(
    rootAncestry.individuals,
    targetAncestry.individuals,
  );

  if (
    viaFamily !== undefined &&
    (viaIndividual === undefined ||
      viaFamily.root + viaFamily.target <=
        viaIndividual.root + viaIndividual.target)
  ) {
    return { ...viaFamily, half: false };
  }
  if (viaIndividual !== undefined) {
    // A direct line (one is the other's ancestor) has no half form.
    const direct = viaIndividual.root === 0 || viaIndividual.target === 0;
    return { ...viaIndividual, half: !direct };
  }
  return undefined;
}
