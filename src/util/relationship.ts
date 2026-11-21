import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";

/** How `targetXref` is related to `rootXref`, from the root's side: the
 * target is the root's "grandfather", "great-aunt", "first cousin once
 * removed", and so on. Blood relationships are found through shared
 * ancestors (or a shared family, when the parents aren't recorded). Failing
 * that, the relationship goes through marriages, with as few as possible:
 * "sister-in-law", "stepmother", "husband of the first cousin", "brother of
 * the wife of the nephew". "self" when they're the same person, undefined
 * when either is missing or nothing connects them. */
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

  const generations = closestCommonAncestor(gedcomDatabase, root, target);
  if (generations !== undefined) {
    return relationshipName(generations.root, generations.target, sex, {
      half: generations.half,
    });
  }

  const segments = marriagePath(gedcomDatabase, rootXref, targetXref);
  return segments && describeMarriagePath(gedcomDatabase, segments);
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
function closestCommonAncestor(
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

// A blood relationship (`start` up to a common ancestor and down to `end`),
// with `end` married to the next segment's `start`.
interface Segment {
  start: GedcomIndividual;
  end: GedcomIndividual;
}

// The path from the root to the target through the fewest marriages, and
// then the fewest parent/child steps, as blood relationships joined by
// marriages. Within a segment the path only goes up and then down, so each
// segment is a single blood relationship.
function marriagePath(
  gedcomDatabase: GedcomDatabase,
  rootXref: string,
  targetXref: string,
): Segment[] | undefined {
  // A marriage outweighs any number of parent/child steps.
  const MARRIAGE = 1_000_000;
  type Phase = "up" | "down";
  type Step = "parent" | "child" | "spouse";
  const key = (xref: string, phase: Phase) => `${phase}${xref}`;

  const cost = new Map<string, number>();
  const previous = new Map<string, { key: string; step: Step }>();
  const queue = new MinQueue<{ xref: string; phase: Phase }>();
  cost.set(key(rootXref, "up"), 0);
  queue.push(0, { xref: rootXref, phase: "up" });

  const visit = (
    from: string,
    fromCost: number,
    xref: string,
    phase: Phase,
    step: Step,
  ) => {
    const toKey = key(xref, phase);
    const toCost = fromCost + (step === "spouse" ? MARRIAGE : 1);
    if (toCost >= (cost.get(toKey) ?? Infinity)) return;
    cost.set(toKey, toCost);
    previous.set(toKey, { key: from, step });
    queue.push(toCost, { xref, phase });
  };

  let foundKey: string | undefined;
  for (let entry = queue.pop(); entry; entry = queue.pop()) {
    const { priority, value } = entry;
    const fromKey = key(value.xref, value.phase);
    if (priority > (cost.get(fromKey) ?? Infinity)) continue;
    if (value.xref === targetXref) {
      foundKey = fromKey;
      break;
    }
    const individual = gedcomDatabase.individuals[value.xref];
    if (individual === undefined) continue;

    if (value.phase === "up") {
      for (const familyXref of individual.childOfFamilyXrefs) {
        const family = gedcomDatabase.families[familyXref];
        for (const parentXref of [family?.husbandXref, family?.wifeXref]) {
          if (parentXref) visit(fromKey, priority, parentXref, "up", "parent");
        }
      }
    }
    for (const familyXref of individual.parentOfFamilyXrefs) {
      const family = gedcomDatabase.families[familyXref];
      if (family === undefined) continue;
      for (const childXref of family.childXrefs) {
        visit(fromKey, priority, childXref, "down", "child");
      }
      for (const spouseXref of [family.husbandXref, family.wifeXref]) {
        if (spouseXref && spouseXref !== value.xref) {
          visit(fromKey, priority, spouseXref, "up", "spouse");
        }
      }
    }
  }
  if (foundKey === undefined) return undefined;

  // Walk back from the target, splitting at each marriage.
  const xrefOf = (stateKey: string) => stateKey.replace(/^(up|down)/, "");
  const segments: { start: string; end: string }[] = [];
  let end = xrefOf(foundKey);
  for (let at = foundKey; ;) {
    const step = previous.get(at);
    if (step === undefined) {
      segments.unshift({ start: xrefOf(at), end });
      break;
    }
    if (step.step === "spouse") {
      segments.unshift({ start: xrefOf(at), end });
      end = xrefOf(step.key);
    }
    at = step.key;
  }

  const result: Segment[] = [];
  for (const segment of segments) {
    const start = gedcomDatabase.individuals[segment.start];
    const segmentEnd = gedcomDatabase.individuals[segment.end];
    if (start === undefined || segmentEnd === undefined) return undefined;
    result.push({ start, end: segmentEnd });
  }
  return result;
}

interface Term {
  name: string;
  sex: string;
  // Generations up and down, for a blood term; undefined for a marriage.
  generations?: { up: number; down: number };
}

function describeMarriagePath(
  gedcomDatabase: GedcomDatabase,
  segments: Segment[],
): string | undefined {
  // Each step from the root outward: a blood relationship, then a marriage,
  // and so on.
  const terms: Term[] = [];
  segments.forEach(({ start, end }, index) => {
    if (index > 0) {
      terms.push({
        name: gendered(start.sex.sex, "husband", "wife", "spouse"),
        sex: start.sex.sex,
      });
    }
    if (start.xref === end.xref) return;
    const generations = closestCommonAncestor(gedcomDatabase, start, end);
    if (generations === undefined) return;
    terms.push({
      name: relationshipName(
        generations.root,
        generations.target,
        end.sex.sex,
        {
          half: generations.half,
        },
      ),
      sex: end.sex.sex,
      generations: { up: generations.root, down: generations.target },
    });
  });

  // Collapse the familiar in-law and step relationships.
  const is = (term: Term | undefined, up: number, down: number) =>
    term?.generations?.up === up && term.generations.down === down;
  const isMarriage = (term: Term | undefined) =>
    term !== undefined && term.generations === undefined;
  const collapsed: string[] = [];
  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const next = terms[i + 1];
    if (term === undefined) continue;
    let name: string | undefined;
    if (next !== undefined) {
      const sex = next.sex;
      if (is(term, 1, 1) && isMarriage(next)) {
        name = gendered(sex, "brother", "sister", "sibling") + "-in-law";
      } else if (isMarriage(term) && is(next, 1, 1)) {
        name = gendered(sex, "brother", "sister", "sibling") + "-in-law";
      } else if (isMarriage(term) && is(next, 1, 0)) {
        name = gendered(sex, "father", "mother", "parent") + "-in-law";
      } else if (is(term, 0, 1) && isMarriage(next)) {
        name = gendered(sex, "son", "daughter", "child") + "-in-law";
      } else if (is(term, 1, 0) && isMarriage(next)) {
        name = "step" + gendered(sex, "father", "mother", "parent");
      } else if (isMarriage(term) && is(next, 0, 1)) {
        name = "step" + gendered(sex, "son", "daughter", "child");
      }
    }
    if (name !== undefined) {
      collapsed.push(name);
      i++;
    } else {
      collapsed.push(term.name);
    }
  }

  // "brother of the wife of the nephew"
  return collapsed.reverse().join(" of the ") || undefined;
}

// A binary min-heap, smallest priority first.
class MinQueue<T> {
  private readonly heap: { priority: number; value: T }[] = [];

  push(priority: number, value: T) {
    this.heap.push({ priority, value });
    let i = this.heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.priority(parent) <= this.priority(i)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): { priority: number; value: T } | undefined {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (top === undefined || last === undefined || this.heap.length === 0) {
      return top;
    }
    this.heap[0] = last;
    for (let i = 0; ;) {
      let smallest = i;
      for (const child of [2 * i + 1, 2 * i + 2]) {
        if (this.priority(child) < this.priority(smallest)) smallest = child;
      }
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
    return top;
  }

  private priority(i: number): number {
    return this.heap[i]?.priority ?? Infinity;
  }

  private swap(i: number, j: number) {
    const a = this.heap[i];
    const b = this.heap[j];
    if (a === undefined || b === undefined) return;
    this.heap[i] = b;
    this.heap[j] = a;
  }
}
