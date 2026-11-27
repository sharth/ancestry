import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomProblem } from "../../util/record-unparsed-records";
import { ValidationTableComponent } from "./validation-table.component";

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
  key: string;
  first: GedcomProblem;
  count: number;
  recordPage?: string;
}

/** Lists what parsing found wrong with the loaded GEDCOM file. */
@Component({
  selector: "app-gedcom-problems",
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./gedcom-problems.component.html",
})
export class GedcomProblemsComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly problems = computed(() => this.gedcom().gedcomProblems);

  readonly rows = computed(() => {
    const groups = new Map<string, ProblemGroup>();
    for (const problem of this.problems()) {
      const key = `${problem.severity} ${problem.path} ${problem.message}`;
      const group = groups.get(key);
      if (group) {
        group.count++;
      } else {
        groups.set(key, {
          key,
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
