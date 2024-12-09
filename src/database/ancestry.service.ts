import { computed, Injectable, resource } from "@angular/core";
import { ancestryDatabase } from "./ancestry.database";
import Dexie from "dexie";
@Injectable({
  providedIn: "root",
})
export class AncestryService {
  constructor() {
    Dexie.on("storagemutated", () => {
      this.ancestryResource.reload();
    });
  }

  ancestryResource = resource({
    loader: async () => {
      const [
        individuals,
        sources,
        families,
        repositories,
        multimedia,
        submitters,
        originalText,
      ] = await ancestryDatabase.transaction(
        "r",
        [
          "individuals",
          "sources",
          "families",
          "repositories",
          "multimedia",
          "submitters",
          "originalText",
        ],
        async () => [
          await ancestryDatabase.individuals.orderBy("xref").toArray(),
          await ancestryDatabase.sources.orderBy("xref").toArray(),
          await ancestryDatabase.families.orderBy("xref").toArray(),
          await ancestryDatabase.repositories.orderBy("xref").toArray(),
          await ancestryDatabase.multimedia.orderBy("xref").toArray(),
          await ancestryDatabase.submitters.orderBy("xref").toArray(),
          await ancestryDatabase.originalText.toArray(),
        ]
      );
      return {
        individuals: new Map(individuals.map((indi) => [indi.xref, indi])),
        sources: new Map(sources.map((source) => [source.xref, source])),
        families: new Map(families.map((family) => [family.xref, family])),
        repositories: new Map(repositories.map((repo) => [repo.xref, repo])),
        multimedia: new Map(multimedia.map((media) => [media.xref, media])),
        submitters: new Map(submitters.map((s) => [s.xref, s])),
        originalText: originalText.map((o) => o.text).join("\n"),
      };
    },
  });

  individuals = computed(() => this.ancestryResource.value()?.individuals);
}
