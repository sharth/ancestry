import { computed, inject, resource, type ResourceRef } from "@angular/core";

import { AncestryService } from "../database/ancestry.service";

// One resource holding the contents of each multimedia file at `filePaths`
// in the data folder, by path. A path with no readable file is left out.
// It reloads when the set of paths changes or different data is loaded.
// Must be called in an injection context.
export function multimediaBlobsResource(
  filePaths: () => readonly string[],
): ResourceRef<ReadonlyMap<string, Blob> | undefined> {
  const ancestryService = inject(AncestryService);
  return resource({
    // A computed() comparing its parts, with the paths sorted and joined, so
    // a new array of the same paths doesn't reload anything.
    params: computed(
      () => ({
        filePaths: [...new Set(filePaths())].sort().join("\n"),
        gedcomResourceValue: ancestryService.gedcomResource.value(),
      }),
      {
        equal: (a, b) =>
          a.filePaths === b.filePaths &&
          a.gedcomResourceValue === b.gedcomResourceValue,
      },
    ),
    loader: async ({ params }) => {
      const paths = params.filePaths ? params.filePaths.split("\n") : [];
      const blobs = await Promise.all(
        paths.map(
          async (filePath) =>
            [
              filePath,
              await ancestryService.getMultimediaFile(filePath),
            ] as const,
        ),
      );
      return new Map(
        blobs.flatMap(([filePath, blob]) =>
          blob ? [[filePath, blob] as const] : [],
        ),
      );
    },
  });
}
