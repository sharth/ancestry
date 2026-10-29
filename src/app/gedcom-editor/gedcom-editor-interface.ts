import { InjectionToken } from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";

import type { GedcomFact } from "../../gedcom/gedcomFact";

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
  familyFactsField(familyXref: string): FieldTree<GedcomFact[]> | undefined;
  addSpouse(individualXref: string, spouseXref: string): string;
}

export const GEDCOM_EDITOR = new InjectionToken<GedcomEditorInterface>(
  "GedcomEditor",
);
