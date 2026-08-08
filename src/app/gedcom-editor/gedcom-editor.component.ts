import type { AncestryDatabase } from "../../database/ancestry.service";
import { AncestryService } from "../../database/ancestry.service";
import { InputIndividualComponent } from "../../forms/input-individual.component";
import { InputMultimediaComponent } from "../../forms/input-multimedia.component";
import { InputRepositoryComponent } from "../../forms/input-repository.component";
import { InputSourceComponent } from "../../forms/input-source.component";
import {
  type GedcomIndividual,
  newGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import {
  type GedcomMultimedia,
  newGedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import {
  type GedcomRepository,
  newGedcomRepository,
} from "../../gedcom/gedcomRepository";
import { type GedcomSource, newGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-gedcom-editor-individual",
  imports: [FormField, InputIndividualComponent],
  template: `<app-input-individual
    [(ancestryDatabase)]="ancestryDatabase"
    [formField]="form"
  ></app-input-individual>`,
})
export class GedcomEditorIndividualComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly individual = linkedSignal<GedcomIndividual>(
    () => {
      return (
        this.ancestryDatabase().individuals[this.xref()] ??
        newGedcomIndividual(this.xref())
      );
    },
    {
      set: (individual) => {
        this.ancestryDatabase.update((database) => ({
          ...database,
          individuals: {
            ...database.individuals,
            [individual.xref]: individual,
          },
        }));
      },
    },
  );

  readonly form = form(this.individual);
}

@Component({
  selector: "app-gedcom-editor-source",
  imports: [FormField, InputSourceComponent],
  template: `<app-input-source
    [(ancestryDatabase)]="ancestryDatabase"
    [formField]="form"
  ></app-input-source>`,
})
export class GedcomEditorSourceComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly source = linkedSignal<GedcomSource>(
    () => {
      return (
        this.ancestryDatabase().sources[this.xref()] ??
        newGedcomSource(this.xref())
      );
    },
    {
      set: (source) => {
        this.ancestryDatabase.update((database) => ({
          ...database,
          sources: {
            ...database.sources,
            [source.xref]: source,
          },
        }));
      },
    },
  );

  readonly form = form(this.source);
}

@Component({
  selector: "app-gedcom-editor-repository",
  imports: [FormField, InputRepositoryComponent],
  template: `<app-input-repository
    [(ancestryDatabase)]="ancestryDatabase"
    [formField]="form"
  ></app-input-repository>`,
})
export class GedcomEditorRepositoryComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly repository = linkedSignal<GedcomRepository>(
    () => {
      return (
        this.ancestryDatabase().repositories[this.xref()] ??
        newGedcomRepository(this.xref())
      );
    },
    {
      set: (repository) => {
        this.ancestryDatabase.update((database) => ({
          ...database,
          repositories: {
            ...database.repositories,
            [repository.xref]: repository,
          },
        }));
      },
    },
  );

  readonly form = form(this.repository);
}

@Component({
  selector: "app-gedcom-editor-multimedia",
  imports: [FormField, InputMultimediaComponent],
  template: `<app-input-multimedia
    [(ancestryDatabase)]="ancestryDatabase"
    [formField]="form"
  ></app-input-multimedia>`,
})
export class GedcomEditorMultimediaComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly multimedia = linkedSignal<GedcomMultimedia>(
    () => {
      return (
        this.ancestryDatabase().multimedias[this.xref()] ??
        newGedcomMultimedia(this.xref())
      );
    },
    {
      set: (multimedia) => {
        this.ancestryDatabase.update((database) => ({
          ...database,
          multimedias: {
            ...database.multimedias,
            [multimedia.xref]: multimedia,
          },
        }));
      },
    },
  );

  readonly form = form(this.multimedia);
}

@Component({
  selector: "app-gedcom-editor",
  imports: [
    GedcomEditorIndividualComponent,
    GedcomEditorSourceComponent,
    GedcomDiffComponent,
    GedcomEditorMultimediaComponent,
    GedcomEditorRepositoryComponent,
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
  readonly type = input.required<"INDI" | "SOUR" | "OBJE" | "REPO">();
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly finished = output();

  readonly computedDatabase = linkedSignal<AncestryDatabase>(() =>
    this.ancestryDatabase(),
  );

  readonly effectiveXref = computed<string>(() => {
    const xref = this.xref();
    if (xref) return xref;

    const database = this.ancestryDatabase();
    switch (this.type()) {
      case "INDI":
        return calculateNextIndividualXref(database.individuals);
      case "SOUR":
        return calculateNextSourceXref(database.sources);
      case "OBJE":
        return calculateNextMultimediaXref(database.multimedias);
      case "REPO":
        return calculateNextRepositoryXref(database.repositories);
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

export function calculateNextRepositoryXref(
  repositories: Record<string, GedcomRepository>,
): string {
  const nextIndex = Object.values(repositories)
    .map((repository) => /^@R(\d+)@/.exec(repository.xref))
    .filter((match) => match != undefined)
    .map((match) => match[1])
    .filter((id) => id !== undefined)
    .map((id) => parseInt(id))
    .reduce((acc, index) => Math.max(acc, index + 1), 0);
  return `@R${nextIndex}@`;
}
