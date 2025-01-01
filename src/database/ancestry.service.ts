import { Injectable, resource } from "@angular/core";
import { AncestryDatabase } from "./ancestry.database";
import Dexie from "dexie";

@Injectable({ providedIn: "root" })
export class AncestryService {
  readonly ancestryDatabase = new AncestryDatabase();

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
      ] = await this.ancestryDatabase.transaction(
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
          await this.ancestryDatabase.individuals.orderBy("xref").toArray(),
          await this.ancestryDatabase.sources.orderBy("xref").toArray(),
          await this.ancestryDatabase.families.orderBy("xref").toArray(),
          await this.ancestryDatabase.repositories.orderBy("xref").toArray(),
          await this.ancestryDatabase.multimedia.orderBy("xref").toArray(),
          await this.ancestryDatabase.submitters.orderBy("xref").toArray(),
          await this.ancestryDatabase.originalText.toArray(),
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
}
