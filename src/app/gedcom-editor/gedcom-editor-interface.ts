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
  // The contents a multimedia record shows while editing: its pending file
  // if one was picked, otherwise the file at its path in the data folder.
  // Undefined while loading or if there's none. Reactive, like a signal.
  multimediaBlob(xref: string): Blob | undefined;
  // Whether multimediaBlob() is still reading files.
  multimediaBlobsLoading(): boolean;
}

export const GEDCOM_EDITOR = new InjectionToken<GedcomEditorInterface>(
  "GedcomEditor",
);
