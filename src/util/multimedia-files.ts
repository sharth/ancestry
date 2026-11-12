import {
  Injector,
  inject,
  resource,
  untracked,
  type ResourceRef,
} from "@angular/core";

import { AncestryService } from "../database/ancestry.service";

// A loader for multimedia files in the data folder. The returned function
// gives the file at a relative path, or undefined while it's loading or if
// there's none. It's reactive: called from a template or computed(), the
// caller updates once the file has loaded, and again whenever a different
// data folder (or GEDCOM file) is loaded.
//
// Each path gets one resource, created on first use and kept until the
// caller's injector is destroyed, so asking for the same path again (say, on
// every change detection) doesn't reread the file. Must be called in an
// injection context.
export function multimediaFiles(): (filePath: string) => File | undefined {
  const ancestryService = inject(AncestryService);
  const injector = inject(Injector);
  const resources = new Map<string, ResourceRef<File | undefined>>();

  return (filePath) => {
    let fileResource = resources.get(filePath);
    if (!fileResource) {
      // Created outside whatever template or computed() is asking, since a
      // resource can't be created inside a reactive context.
      fileResource = untracked(() =>
        resource({
          params: () => ({
            filePath,
            gedcomResourceValue: ancestryService.gedcomResource.value(),
          }),
          loader: () => ancestryService.getMultimediaFile(filePath),
          injector,
        }),
      );
      resources.set(filePath, fileResource);
    }
    return fileResource.hasValue() ? fileResource.value() : undefined;
  };
}
