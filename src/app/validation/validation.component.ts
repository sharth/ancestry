import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { bibliographyForMissingTitle } from "./apply-bibliography-title-suggestion.util";
import { findDuplicateCallNumbers } from "./duplicate-call-numbers.component";
import { findDuplicateRepositories } from "./duplicate-repositories.component";
import { findDuplicateSources } from "./duplicate-sources.component";
import { findOutdatedUrls } from "./outdated-urls.component";
import { findQueryStringCallNumbers } from "./query-string-call-numbers.component";
import { findSourceWarnings } from "./source-warnings.component";
import { findSourcesWithoutRepositories } from "./sources-without-repositories.component";
import { findTreeIdsToConvert } from "./tree-ids.component";
import { findUnusedMultimedia } from "./unused-multimedia.component";
import { findUnusedSources } from "./unused-sources.component";

// Each tab's id is its child route's path (see app.routes.ts).
const tabs = [
  { id: "source-warnings", label: "Source warnings" },
  { id: "sources-without-repositories", label: "Sources without repositories" },
  { id: "duplicate-call-numbers", label: "Duplicate call numbers" },
  {
    id: "query-string-call-numbers",
    label: "Call numbers with query strings",
  },
  { id: "duplicate-repositories", label: "Duplicate repositories" },
  { id: "duplicate-sources", label: "Duplicate sources" },
  { id: "unused-sources", label: "Unused sources" },
  { id: "unused-multimedia", label: "Unused multimedia" },
  { id: "bibliography-without-title", label: "Bibliography without title" },
  { id: "tree-ids", label: "Tree ids" },
  { id: "outdated-urls", label: "Outdated URLs" },
  { id: "gedcom-problems", label: "GEDCOM problems" },
] as const;

type TabId = (typeof tabs)[number]["id"];

/** The validation page: a tab per check, each check a routed child
 * component that reviews and saves its own suggested fixes. */
@Component({
  selector: "app-validation",
  imports: [RouterModule],
  templateUrl: "./validation.component.html",
})
export class ValidationComponent {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly tabs = tabs;

  // How many findings each tab lists, shown on the tab itself -- computed
  // here, not by the tab's own component, since only the active tab's
  // component is rendered.
  readonly tabCounts = computed<Record<TabId, number>>(() => {
    const database = this.ancestryDatabase();
    return {
      "source-warnings": findSourceWarnings(database).length,
      "sources-without-repositories":
        findSourcesWithoutRepositories(database).length,
      "duplicate-call-numbers": findDuplicateCallNumbers(database).length,
      "query-string-call-numbers": findQueryStringCallNumbers(database).length,
      "duplicate-repositories": findDuplicateRepositories(database).length,
      "unused-sources": findUnusedSources(database).length,
      "unused-multimedia": findUnusedMultimedia(database).length,
      "bibliography-without-title": Object.values(database.sources).filter(
        (source) => bibliographyForMissingTitle(source) !== undefined,
      ).length,
      "tree-ids": findTreeIdsToConvert(database).length,
      "outdated-urls": findOutdatedUrls(database).length,
      "duplicate-sources": findDuplicateSources(database).length,
      "gedcom-problems": this.gedcom().gedcomProblems.length,
    };
  });
}
