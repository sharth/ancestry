import { InjectionToken, inject } from "@angular/core";

import { AncestryService } from "./ancestry.service";

// Where multimedia previews read the file at a GEDCOM file path. Normally
// that's the data folder (AncestryService). The GEDCOM editor provides its
// own, which also has the files picked from outside the folder that it will
// copy in on submit, so they can be shown before they're copied.
export interface MultimediaFileSource {
  // Changes whenever the file at a path might have. Reactive: read it in a
  // resource's params so the resource reloads then.
  multimediaFilesVersion(): unknown;
  // The file at `relativePath`, or undefined if there's none.
  getMultimediaFile(relativePath: string): Promise<File | undefined>;
}

export const MULTIMEDIA_FILE_SOURCE = new InjectionToken<MultimediaFileSource>(
  "MultimediaFileSource",
  { providedIn: "root", factory: () => inject(AncestryService) },
);
