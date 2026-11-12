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
  // The file a multimedia record shows while editing: its pending file if
  // one was picked, otherwise whatever is at its file path in the data
  // folder. Undefined while loading or if there's none. Reactive, like a
  // signal read.
  multimediaFile(xref: string): File | undefined;
}

export const GEDCOM_EDITOR = new InjectionToken<GedcomEditorInterface>(
  "GedcomEditor",
);
