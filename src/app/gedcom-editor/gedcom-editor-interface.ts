import { InjectionToken } from "@angular/core";

export interface TabInformation {
  type: "INDI" | "SOUR" | "FAM" | "REPO" | "OBJE" | "SUBM";
  xref: string;
}

export interface GedcomEditorInterface {
  openNewIndividual(): string;
  openIndividual(xref: string): void;
  openNewMultimedia(): string;
  openMultimedia(xref: string): void;
  openNewRepository(): string;
  openRepository(xref: string): void;
  openNewSource(): string;
  openSource(xref: string): void;
  openNewFamily(): string;
  openFamily(xref: string): void;
  // A file picked for a multimedia record from outside the data folder,
  // copied into the folder (at the record's file path) only on submit.
  pendingMultimediaFile(xref: string): File | undefined;
  setPendingMultimediaFile(xref: string, file: File | undefined): void;
}

export const GEDCOM_EDITOR = new InjectionToken<GedcomEditorInterface>(
  "GedcomEditor",
);
