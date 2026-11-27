import { inject, resourceFromSnapshots } from "@angular/core";
import {
  RedirectCommand,
  Router,
  type CanActivateFn,
  type ResourceContext,
  type ResourceResult,
} from "@angular/router";

import { AncestryService, loadedGedcom } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";

/** Shows the not-found page when `:xref` isn't an individual in the loaded
 * file, leaving the requested URL in the address bar. Runs alongside
 * ancestryDatabaseGuard (guards run together, but the first one's redirect
 * to /settings wins), so it waits for the file to load too. */
export const individualExistsGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const gedcom = await loadedGedcom();
  const xref = route.paramMap.get("xref") ?? "";
  if (gedcom?.gedcomDatabase.individuals[xref] !== undefined) {
    return true;
  }
  return new RedirectCommand(router.parseUrl("/not-found"), {
    browserUrl: state.url,
  });
};

/** The individual page's `resources`: the loaded file as `gedcom`, plus
 * the `:xref` individual from it as `individual`. Both are bound to
 * component inputs of the same name (child tab routes inherit them), and
 * stay in step with gedcomResource, so a save reaches the page with no
 * navigation. If the individual disappears from the file after the page
 * opened, the resource errors rather than handing the page `undefined`. */
export function individualResources({
  params,
}: ResourceContext): ResourceResult {
  const gedcom = inject(AncestryService).gedcomResource;
  const individual = resourceFromSnapshots(() => {
    const snapshot = gedcom.snapshot();
    if (snapshot.status === "error") {
      return snapshot;
    }
    const xref = String(params()["xref"]);
    const individual: GedcomIndividual | undefined =
      snapshot.value?.gedcomDatabase.individuals[xref];
    if (individual === undefined) {
      return {
        status: "error",
        error: new Error(`No individual ${xref} in the GEDCOM file`),
      };
    }
    return { ...snapshot, value: individual };
  });
  return {
    gedcom,
    individual: Object.assign(individual, { reload: () => gedcom.reload() }),
  };
}
