import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomProblem } from "../../util/record-unparsed-records";

// The page each top-level record type is shown on, by tag.
const recordPages: Partial<Record<string, string>> = {
  INDI: "/individual",
  FAM: "/family",
  SOUR: "/source",
  REPO: "/repository",
  OBJE: "/multimedia",
};

/** The problems that share a path, severity and message, which a large file
 * can have thousands of (one per _UID, say), shown as one row. */
interface ProblemGroup {
  first: GedcomProblem;
  count: number;
  recordPage?: string;
}

/** Lists what parsing found wrong with the loaded GEDCOM file. */
@Component({
  selector: "app-gedcom-problems",
  imports: [RouterModule],
  templateUrl: "./gedcom-problems.component.html",
})
export class GedcomProblemsComponent {
  readonly problems = input.required<GedcomProblem[]>();

  readonly groups = computed(() => {
    const groups = new Map<string, ProblemGroup>();
    for (const problem of this.problems()) {
      const key = `${problem.severity} ${problem.path} ${problem.message}`;
      const group = groups.get(key);
      if (group) {
        group.count++;
      } else {
        groups.set(key, {
          first: problem,
          count: 1,
          recordPage:
            problem.xref === ""
              ? undefined
              : recordPages[problem.path.split(".")[0] ?? ""],
        });
      }
    }
    return groups.values().toArray();
  });
}
