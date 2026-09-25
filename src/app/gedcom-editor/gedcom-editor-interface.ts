import { InjectionToken } from "@angular/core";

export interface GedcomEditorInterface {
  openNewIndividual(): string;
  openIndividual(xref: string): void;
  openNewMultimedia(): string;
  openMultimedia(xref: string): void;
  openNewRepository(): string;
  openRepository(xref: string): void;
  openNewSource(): string;
  openSource(xref: string): void;
}

export const GEDCOM_EDITOR = new InjectionToken<GedcomEditorInterface>(
  "GedcomEditor",
);
