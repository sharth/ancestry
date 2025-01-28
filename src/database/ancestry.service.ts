import { Injectable, resource, signal } from "@angular/core";
import { AncestryDatabase } from "./ancestry.database";
import Dexie from "dexie";

@Injectable({ providedIn: "root" })
export class AncestryService {
  readonly ancestryDatabase = new AncestryDatabase();

  // A signal that increments every time the Dexie / IndexedDB database changes.
  // This can be used in the request field for an Angular Resource.
  readonly ancestryChanges = signal(0);

  constructor() {
    Dexie.on("storagemutated", () => {
      console.log("Dexie database mutated");
      this.ancestryChanges.update((value) => value + 1);
    });
  }

  ancestryResource = resource({
    request: () => ({
      changeCount: this.ancestryChanges(),
    }),
    loader: async () => {
      const [
        individuals,
        sources,
        families,
        repositories,
        multimedia,
        submitters,
        headers,
        originalRecords,
      ] = await this.ancestryDatabase.transaction(
        "r",
        [
          "individuals",
          "sources",
          "families",
          "repositories",
          "multimedia",
          "submitters",
          "headers",
          "originalRecords",
        ],
        async () => [
          await this.ancestryDatabase.individuals.orderBy("xref").toArray(),
          await this.ancestryDatabase.sources.orderBy("xref").toArray(),
          await this.ancestryDatabase.families.orderBy("xref").toArray(),
          await this.ancestryDatabase.repositories.orderBy("xref").toArray(),
          await this.ancestryDatabase.multimedia.orderBy("xref").toArray(),
          await this.ancestryDatabase.submitters.orderBy("xref").toArray(),
          await this.ancestryDatabase.headers.toArray(),
          await this.ancestryDatabase.originalRecords.toArray(),
        ]
      );
      return {
        individuals: new Map(individuals.map((indi) => [indi.xref, indi])),
        sources: new Map(sources.map((source) => [source.xref, source])),
        families: new Map(families.map((family) => [family.xref, family])),
        repositories: new Map(repositories.map((repo) => [repo.xref, repo])),
        multimedia: new Map(multimedia.map((media) => [media.xref, media])),
        submitters: new Map(submitters.map((s) => [s.xref, s])),
        headers,
        originalRecords,
      };
    },
  });
}
