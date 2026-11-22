import type { GedcomDatabase } from "../gedcom/gedcomDatabase";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";

// Finding a relationship is a search, and naming it is a separate step:
//
// 1. findPath searches outward from the root along parent, child and spouse
//    links for the target, through as few marriages as possible.
// 2. describePath splits that path at each marriage into blood links (up to
//    a common ancestor, then down) and names them: "first cousin",
//    "sister-in-law", "wife of the first cousin".

/** How `targetXref` is related to `rootXref`, from the root's side: the
 * target is the root's "grandfather", "great-aunt", "stepmother", "wife of
 * the first cousin", and so on. "self" when they're the same person,
 * undefined when either is missing or nothing connects them. */
export function describeRelationship(
  gedcomDatabase: GedcomDatabase,
  rootXref: string,
  targetXref: string,
): string | undefined {
  const root = gedcomDatabase.individuals[rootXref];
  const target = gedcomDatabase.individuals[targetXref];
  if (root === undefined || target === undefined) return undefined;
  if (root === target) return "self";

  // A spouse who is also a cousin is still called a spouse.
  const path = spouseOf(gedcomDatabase, root, target)
    ? [{ kind: "spouse" as const, individual: target }]
    : findPath(gedcomDatabase, root, target);
  return path && describePath(gedcomDatabase, root, path);
}

// One step along a path: to a parent, a child or a spouse of the previous
// individual.
interface Step {
  kind: "parent" | "child" | "spouse";
  individual: GedcomIndividual;
}

// The shortest path from the root to the target using the fewest marriages.
// A blood relationship goes up to a common ancestor and then down, so once
// a path has stepped down to a child it can't step up to a parent again
// until after a marriage.
function findPath(
  gedcomDatabase: GedcomDatabase,
  root: GedcomIndividual,
  target: GedcomIndividual,
): Step[] | undefined {
  interface State {
    individual: GedcomIndividual;
    goingDown: boolean;
    path: Step[];
  }
  const visited = new Set<string>();

  // Breadth first within each marriage count; a step to a spouse is queued
  // for the next count.
  let queue: State[] = [{ individual: root, goingDown: false, path: [] }];
  while (queue.length > 0) {
    const nextQueue: State[] = [];
    // The loop picks up states pushed onto `queue` while it runs.
    for (const { individual, goingDown, path } of queue) {
      const key = `${goingDown ? "down" : "up"} ${individual.xref}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (individual === target) return path;

      for (const step of neighbors(gedcomDatabase, individual)) {
        if (step.kind === "parent" && goingDown) continue;
        const next = {
          individual: step.individual,
          goingDown: step.kind === "child",
          path: [...path, step],
        };
        (step.kind === "spouse" ? nextQueue : queue).push(next);
      }
    }
    queue = nextQueue;
  }
  return undefined;
}

function neighbors(
  gedcomDatabase: GedcomDatabase,
  individual: GedcomIndividual,
): Step[] {
  const steps: Step[] = [];
  const add = (kind: Step["kind"], xref: string) => {
    const other = gedcomDatabase.individuals[xref];
    if (other !== undefined && other !== individual) {
      steps.push({ kind, individual: other });
    }
  };
  for (const familyXref of individual.childOfFamilyXrefs) {
    const family = gedcomDatabase.families[familyXref];
    add("parent", family?.husbandXref ?? "");
    add("parent", family?.wifeXref ?? "");
  }
  for (const familyXref of individual.parentOfFamilyXrefs) {
    const family = gedcomDatabase.families[familyXref];
    add("spouse", family?.husbandXref ?? "");
    add("spouse", family?.wifeXref ?? "");
    for (const childXref of family?.childXrefs ?? []) add("child", childXref);
  }
  return steps;
}

function spouseOf(
  gedcomDatabase: GedcomDatabase,
  individual: GedcomIndividual,
  other: GedcomIndividual,
): boolean {
  return neighbors(gedcomDatabase, individual).some(
    (step) => step.kind === "spouse" && step.individual === other,
  );
}

// Whether two individuals are full siblings: children of one family, or
// of two families with the same two parents.
function shareParents(
  gedcomDatabase: GedcomDatabase,
  a: GedcomIndividual,
  b: GedcomIndividual,
): boolean {
  const parents = (individual: GedcomIndividual) =>
    new Set(
      neighbors(gedcomDatabase, individual)
        .filter((step) => step.kind === "parent")
        .map((step) => step.individual),
    );
  const aParents = parents(a);
  const shared = [...parents(b)].filter((parent) => aParents.has(parent));
  return (
    shared.length >= 2 ||
    a.childOfFamilyXrefs.some((xref) => b.childOfFamilyXrefs.includes(xref))
  );
}

// A piece of a path: a blood relationship, `up` generations to a common
// ancestor and `down` again, or a marriage. `individual` is where it ends.
type Link =
  | {
      kind: "blood";
      up: number;
      down: number;
      half: boolean;
      individual: GedcomIndividual;
    }
  | { kind: "marriage"; individual: GedcomIndividual };

function describePath(
  gedcomDatabase: GedcomDatabase,
  root: GedcomIndividual,
  path: Step[],
): string {
  // Split the path into links.
  const links: Link[] = [];
  let blood: Extract<Link, { kind: "blood" }> | undefined;
  let previous = root;
  let beforePeak = root;
  for (const step of path) {
    if (step.kind === "spouse") {
      blood = undefined;
      links.push({ kind: "marriage", individual: step.individual });
    } else {
      if (blood === undefined) {
        blood = {
          kind: "blood",
          up: 0,
          down: 0,
          half: false,
          individual: previous,
        };
        links.push(blood);
      }
      if (step.kind === "parent") {
        blood.up++;
        beforePeak = previous;
      } else {
        // At the common ancestor, the half relationships are the ones whose
        // two lines come down from different families.
        if (blood.down === 0 && blood.up > 0) {
          blood.half = !shareParents(
            gedcomDatabase,
            beforePeak,
            step.individual,
          );
        }
        blood.down++;
      }
      blood.individual = step.individual;
    }
    previous = step.individual;
  }

  // Name each link, using a single word for the familiar pairs.
  const names: string[] = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const next = links[i + 1];
    if (link === undefined) continue;
    if (next !== undefined) {
      const pair = PAIRED_NAMES[`${linkKind(link)} ${linkKind(next)}`];
      if (pair !== undefined) {
        names.push(gendered(next.individual.sex.sex, ...pair));
        i++;
        continue;
      }
    }
    names.push(linkName(link));
  }

  // From the root outward, read back to front: "wife of the first cousin".
  return names.reverse().join(" of the ");
}

function linkName(link: Link): string {
  const sex = link.individual.sex.sex;
  return link.kind === "marriage"
    ? gendered(sex, "husband", "wife", "spouse")
    : relationshipName(link.up, link.down, sex, { half: link.half });
}

function linkKind(link: Link): string {
  if (link.kind === "marriage") return "spouse";
  if (link.half) return "other";
  if (link.up === 1 && link.down === 0) return "parent";
  if (link.up === 0 && link.down === 1) return "child";
  if (link.up === 1 && link.down === 1) return "sibling";
  return "other";
}

// Two links in a row with a name of their own, as [male, female, neutral].
const PAIRED_NAMES: Record<string, [string, string, string] | undefined> = {
  "sibling spouse": ["brother-in-law", "sister-in-law", "sibling-in-law"],
  "spouse sibling": ["brother-in-law", "sister-in-law", "sibling-in-law"],
  "spouse parent": ["father-in-law", "mother-in-law", "parent-in-law"],
  "child spouse": ["son-in-law", "daughter-in-law", "child-in-law"],
  "parent spouse": ["stepfather", "stepmother", "stepparent"],
  "spouse child": ["stepson", "stepdaughter", "stepchild"],
};

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
