import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { ActivatedRoute, Router } from "@angular/router";
import { produce } from "immer";
import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import {
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextRepositoryXref,
  calculateNextSourceXref,
} from "../../util/next-xref";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { InputIndividualComponent } from "./input-individual.component";
import { InputMultimediaComponent } from "./input-multimedia.component";
import { InputRepositoryComponent } from "./input-repository.component";
import { InputSourceComponent } from "./input-source.component";

@Component({
  selector: "app-gedcom-editor",
  imports: [
    FormField,
    GedcomDiffComponent,
    InputIndividualComponent,
    InputMultimediaComponent,
    InputRepositoryComponent,
    InputSourceComponent,
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
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly finished = output();

  // We allow the user to pass an empty string as the xref to this component.
  // If this happens, we should calculate what the next xref is and use that.
  readonly effectiveXref = computed<string>(() => {
    const xref = this.xref();
    if (xref) return xref;

    switch (this.type()) {
      case "INDI":
        return calculateNextIndividualXref(this.ancestryDatabase());
      case "SOUR":
        return calculateNextSourceXref(this.ancestryDatabase());
      case "OBJE":
        return calculateNextMultimediaXref(this.ancestryDatabase());
      case "REPO":
        return calculateNextRepositoryXref(this.ancestryDatabase());
    }
  });

  // The GedcomDatabase that the form will be manipulating and editing.
  // When the editor completes successfully, we will persist this instance of the database.
  // If the user provides an xref that is not present in the database (or an empty string), we should instantiate a new object.
  readonly workingDatabase = linkedSignal<GedcomDatabase>(() => {
    const xref = this.effectiveXref();
    return produce(this.ancestryDatabase(), (draft) => {
      switch (this.type()) {
        case "INDI":
          draft.individuals[xref] ??= newGedcomIndividual({ xref });
          break;
        case "SOUR":
          draft.sources[xref] ??= newGedcomSource({ xref });
          break;
        case "OBJE":
          draft.multimedias[xref] ??= newGedcomMultimedia({ xref });
          break;
        case "REPO":
          draft.repositories[xref] ??= newGedcomRepository({ xref });
          break;
      }
    });
  });

  // The set of xrefs that are currently being modified by the form.
  // - Adding an xref to the set will cause it to be included in the form.
  // - Removing an xref from the set will cause it to be removed from the
  //   form, but any changes made will be maintained in workingDatabase().
  readonly xrefsIncludedInView = linkedSignal<TabInformation[]>(() => [
    { type: this.type(), xref: this.effectiveXref() },
  ]);

  // A GedcomDatabase made up of only the xrefs found in `xrefsIncludedInView`.
  // Any changes will be persisted in workingDatabase().
  // This will be used in the Angular Signal Forms. The indirection is required,
  // because if we used `form = form(this.workingDatabase)`, that call would take a few seconds.
  readonly workingDatabaseView = linkedSignal<GedcomDatabase>(
    () => ({
      submitters: filteredProperties(
        this.workingDatabase().submitters,
        this.xrefsIncludedInView()
          .filter((tabInformation) => tabInformation.type === "SUBM")
          .map((tabInformation) => tabInformation.xref),
      ),
      individuals: filteredProperties(
        this.workingDatabase().individuals,
        this.xrefsIncludedInView()
          .filter((tabInformation) => tabInformation.type === "INDI")
          .map((tabInformation) => tabInformation.xref),
      ),
      families: filteredProperties(
        this.workingDatabase().families,
        this.xrefsIncludedInView()
          .filter((tabInformation) => tabInformation.type === "FAM")
          .map((tabInformation) => tabInformation.xref),
      ),
      sources: filteredProperties(
        this.workingDatabase().sources,
        this.xrefsIncludedInView()
          .filter((tabInformation) => tabInformation.type === "SOUR")
          .map((tabInformation) => tabInformation.xref),
      ),
      repositories: filteredProperties(
        this.workingDatabase().repositories,
        this.xrefsIncludedInView()
          .filter((tabInformation) => tabInformation.type === "REPO")
          .map((tabInformation) => tabInformation.xref),
      ),
      multimedias: filteredProperties(
        this.workingDatabase().multimedias,
        this.xrefsIncludedInView()
          .filter((tabInformation) => tabInformation.type === "OBJE")
          .map((tabInformation) => tabInformation.xref),
      ),
    }),
    {
      set: (updates: GedcomDatabase) => {
        this.workingDatabase.update((database) => ({
          submitters: { ...database.submitters, ...updates.submitters },
          individuals: { ...database.individuals, ...updates.individuals },
          families: { ...database.families, ...updates.families },
          sources: { ...database.sources, ...updates.sources },
          repositories: { ...database.repositories, ...updates.repositories },
          multimedias: { ...database.multimedias, ...updates.multimedias },
        }));
      },
    },
  );

  readonly form = form(this.workingDatabaseView);

  readonly differences = computed(() =>
    this.ancestryService
      .compareGedcomDatabase(this.workingDatabase())
      .filter(
        ({ originalGedcomRecord, updatedGedcomRecord }) =>
          originalGedcomRecord == undefined ||
          updatedGedcomRecord == undefined ||
          serializeGedcomRecordToText(originalGedcomRecord).join("\n") !==
            serializeGedcomRecordToText(updatedGedcomRecord).join("\n"),
      ),
  );

  readonly activeTab = linkedSignal<TabInformation>(() => ({
    type: this.type(),
    xref: this.effectiveXref(),
  }));

  openNewIndividual(): string {
    const xref = calculateNextIndividualXref(this.workingDatabase());
    this.openTab({ type: "INDI", xref });
    return xref;
  }

  openIndividual(xref: string) {
    this.openTab({ type: "INDI", xref });
  }

  openNewMultimedia(): string {
    const xref = calculateNextMultimediaXref(this.workingDatabase());
    this.openTab({ type: "OBJE", xref });
    return xref;
  }

  openMultimedia(xref: string) {
    this.openTab({ type: "OBJE", xref });
  }

  openNewRepository(): string {
    const xref = calculateNextRepositoryXref(this.workingDatabase());
    this.openTab({ type: "REPO", xref });
    return xref;
  }

  openRepository(xref: string) {
    this.openTab({ type: "REPO", xref });
  }

  openNewSource(): string {
    const xref = calculateNextSourceXref(this.workingDatabase());
    this.openTab({ type: "SOUR", xref });
    return xref;
  }

  openSource(xref: string) {
    this.openTab({ type: "SOUR", xref });
  }

  openTab(tabInformation: TabInformation) {
    const xref = tabInformation.xref;
    // Create a new user in the database if one didn't already exist.
    this.workingDatabase.update((workingDatabase) =>
      produce(workingDatabase, (draft) => {
        switch (tabInformation.type) {
          case "INDI":
            draft.individuals[xref] ??= newGedcomIndividual({ xref });
            break;
          case "SOUR":
            draft.sources[xref] ??= newGedcomSource({ xref });
            break;
          case "FAM":
            draft.families[xref] ??= newGedcomFamily({ xref });
            break;
          case "REPO":
            draft.repositories[xref] ??= newGedcomRepository({ xref });
            break;
          case "OBJE":
            draft.multimedias[xref] ??= newGedcomMultimedia({ xref });
            break;
          case "SUBM":
            draft.submitters[xref] ??= newGedcomSubmitter({ xref });
            break;
        }
      }),
    );

    // Include the xref in the list of editable tabs.
    if (
      !this.xrefsIncludedInView().some(
        (other) =>
          other.type == tabInformation.type &&
          other.xref == tabInformation.xref,
      )
    ) {
      this.xrefsIncludedInView.update((xrefsIncludedInView) => [
        ...xrefsIncludedInView,
        tabInformation,
      ]);
    }

    // Update the view to look at this xref.
    this.activeTab.set(tabInformation);
  }

  tabIcon(tabInformation: TabInformation): string {
    switch (tabInformation.type) {
      case "INDI":
        return "bi-person";
      case "FAM":
        return "bi-people";
      case "SOUR":
        return "bi-journal-bookmark";
      case "REPO":
        return "bi-building";
      case "OBJE":
        return "bi-image";
      case "SUBM":
        return "bi-person-gear";
    }
  }

  tabLabel(tabInformation: TabInformation): string {
    const database = this.workingDatabase();
    const xref = tabInformation.xref;
    switch (tabInformation.type) {
      case "INDI": {
        const individual = database.individuals[xref];
        return individual?.names[0] ?
            displayGedcomName(individual.names[0])
          : `Individual ${xref}`;
      }
      case "FAM": {
        return `Family ${xref}`;
      }
      case "SOUR": {
        const source = database.sources[xref];
        return source?.abbr || source?.title || `Source ${xref}`;
      }
      case "REPO": {
        const repository = database.repositories[xref];
        return repository?.name || `Repository ${xref}`;
      }
      case "OBJE": {
        const multimedia = database.multimedias[xref];
        return (
          multimedia?.title || multimedia?.filePath || `Multimedia ${xref}`
        );
      }
      case "SUBM": {
        const submitter = database.submitters[xref];
        return submitter?.name || `Submitter ${xref}`;
      }
    }
  }

  async submitForm() {
    await this.ancestryService.updateGedcomDatabase(this.workingDatabase());
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

function filteredProperties<T>(
  record: Record<string, T>,
  includedKeys: string[],
): Record<string, T> {
  const result: Record<string, T> = {};

  for (const key of includedKeys) {
    const value = record[key];
    if (value) {
      result[key] = value;
    }
  }

  return result;
}

interface TabInformation {
  type: "INDI" | "SOUR" | "FAM" | "REPO" | "OBJE" | "SUBM";
  xref: string;
}
