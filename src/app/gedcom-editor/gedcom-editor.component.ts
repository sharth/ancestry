import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import { InputMultimediaComponent } from "../../forms/input-multimedia.component";
import { InputSourceComponent } from "../../forms/input-source.component";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import type { GedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-gedcom-editor",
  imports: [
    InputIndividualComponent,
    InputSourceComponent,
    InputMultimediaComponent,
    GedcomDiffComponent,
  ],
  templateUrl: "./gedcom-editor.component.html",
  styleUrl: "./gedcom-editor.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GedcomEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly xref = input<string>();
  readonly type = input.required<"INDI" | "SOUR" | "OBJE">();
  readonly finished = output();

  readonly computedDatabase = signal<AncestryDatabase>(
    this.ancestryService.ancestryDatabase() ?? {
      individuals: {},
      families: {},
      sources: {},
      multimedias: {},
      submitters: {},
      repositories: {},
    },
  );

  readonly effectiveXref = computed<string>(() => {
    const xref = this.xref();
    if (xref) return xref;

    const database = this.computedDatabase();
    switch (this.type()) {
      case "INDI":
        return calculateNextIndividualXref(database.individuals);
      case "SOUR":
        return calculateNextSourceXref(database.sources);
      case "OBJE":
        return calculateNextMultimediaXref(database.multimedias);
    }
  });

  readonly differences = computed(() =>
    this.ancestryService
      .compareGedcomDatabase(this.computedDatabase())
      .filter(
        ({ canonicalRecord, currentRecord }) =>
          canonicalRecord == undefined ||
          currentRecord == undefined ||
          serializeGedcomRecordToText(canonicalRecord).join("\n") !==
            serializeGedcomRecordToText(currentRecord).join("\n"),
      ),
  );

  async submitForm() {
    const computedDatabase = this.computedDatabase();
    await this.ancestryService.updateGedcomDatabase(computedDatabase);
    await this.router.navigate([], {
      relativeTo: this.route,
      onSameUrlNavigation: "reload",
      skipLocationChange: true,
    });
    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}

export function calculateNextIndividualXref(
  individuals: Record<string, GedcomIndividual>,
): string {
  const nextIndex = Object.values(individuals)
    .map((individual) => /^@I(\d+)@/.exec(individual.xref))
    .filter((match) => match != undefined)
    .map((match) => match[1])
    .filter((id) => id !== undefined)
    .map((id) => parseInt(id))
    .reduce((acc, index) => Math.max(acc, index + 1), 0);
  return `@I${nextIndex}@`;
}

export function calculateNextSourceXref(
  sources: Record<string, GedcomSource>,
): string {
  const nextIndex = Object.values(sources)
    .map((source) => /^@S(\d+)@/.exec(source.xref))
    .filter((match) => match != undefined)
    .map((match) => match[1])
    .filter((id) => id !== undefined)
    .map((id) => parseInt(id))
    .reduce((acc, index) => Math.max(acc, index + 1), 0);
  return `@S${nextIndex}@`;
}

export function calculateNextMultimediaXref(
  multimedias: Record<string, GedcomMultimedia>,
): string {
  const nextIndex = Object.values(multimedias)
    .map((multimedia) => /^@M(\d+)@/.exec(multimedia.xref))
    .filter((match) => match != undefined)
    .map((match) => match[1])
    .filter((id) => id !== undefined)
    .map((id) => parseInt(id))
    .reduce((acc, index) => Math.max(acc, index + 1), 0);
  return `@M${nextIndex}@`;
}
