import {
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
import {
  AncestryService,
  type AncestryDatabase,
} from "../../database/ancestry.service";
import {
  newGedcomIndividual,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import {
  newGedcomMultimedia,
  type GedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import {
  newGedcomRepository,
  type GedcomRepository,
} from "../../gedcom/gedcomRepository";
import { newGedcomSource, type GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { InputIndividualComponent } from "./input-individual.component";
import { InputMultimediaComponent } from "./input-multimedia.component";
import { InputRepositoryComponent } from "./input-repository.component";
import { InputSourceComponent } from "./input-source.component";

@Component({
  selector: "app-gedcom-editor-individual",
  imports: [FormField, InputIndividualComponent],
  template: `<app-input-individual
    [workingDatabase]="workingDatabase()"
    [formField]="form"
  ></app-input-individual>`,
})
export class GedcomEditorIndividualComponent {
  readonly xref = input.required<string>();
  readonly workingDatabase = model.required<AncestryDatabase>();

  readonly individual = linkedSignal<GedcomIndividual>(
    () => {
      return (
        this.workingDatabase().individuals[this.xref()] ??
        newGedcomIndividual({ xref: this.xref() })
      );
    },
    {
      set: (individual) => {
        this.workingDatabase.update((database) => ({
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
    [workingDatabase]="workingDatabase()"
    [formField]="form"
  ></app-input-source>`,
})
export class GedcomEditorSourceComponent {
  readonly xref = input.required<string>();
  readonly workingDatabase = model.required<AncestryDatabase>();

  readonly source = linkedSignal<GedcomSource>(
    () => {
      return (
        this.workingDatabase().sources[this.xref()] ??
        newGedcomSource({ xref: this.xref() })
      );
    },
    {
      set: (source) => {
        this.workingDatabase.update((database) => ({
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
    [workingDatabase]="workingDatabase()"
    [formField]="form"
  ></app-input-repository>`,
})
export class GedcomEditorRepositoryComponent {
  readonly xref = input.required<string>();
  readonly workingDatabase = model.required<AncestryDatabase>();

  readonly repository = linkedSignal<GedcomRepository>(
    () => {
      return (
        this.workingDatabase().repositories[this.xref()] ??
        newGedcomRepository({ xref: this.xref() })
      );
    },
    {
      set: (repository) => {
        this.workingDatabase.update((database) => ({
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
    [workingDatabase]="workingDatabase()"
    [formField]="form"
  ></app-input-multimedia>`,
})
export class GedcomEditorMultimediaComponent {
  readonly xref = input.required<string>();
  readonly workingDatabase = model.required<AncestryDatabase>();

  readonly multimedia = linkedSignal<GedcomMultimedia>(
    () => {
      return (
        this.workingDatabase().multimedias[this.xref()] ??
        newGedcomMultimedia({ xref: this.xref() })
      );
    },
    {
      set: (multimedia) => {
        this.workingDatabase.update((database) => ({
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
})
export class GedcomEditorComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly xref = input<string>();
  readonly type = input.required<"INDI" | "SOUR" | "OBJE" | "REPO">();
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly finished = output();

  readonly workingDatabase = linkedSignal<AncestryDatabase>(() =>
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
      .compareGedcomDatabase(this.workingDatabase())
      .filter(
        ({ canonicalRecord, currentRecord }) =>
          canonicalRecord == undefined ||
          currentRecord == undefined ||
          serializeGedcomRecordToText(canonicalRecord).join("\n") !==
            serializeGedcomRecordToText(currentRecord).join("\n"),
      ),
  );

  async submitForm() {
    const computedDatabase = this.workingDatabase();
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
