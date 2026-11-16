import { InjectionToken, type Signal } from "@angular/core";

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
  // The ids (see GedcomFact.id) of the facts in the file as it was loaded. A
  // fact's type can only be changed while the fact is new, so that a Birth
  // with citations can't be turned into a Death by accident.
  readonly savedFactIds: Signal<ReadonlySet<number>>;
}

export const GEDCOM_EDITOR = new InjectionToken<GedcomEditorInterface>(
  "GedcomEditor",
);
