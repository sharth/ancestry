import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
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
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import { multimediaFilePathProblem } from "../../util/multimedia-file-name";
import {
  calculateNextFamilyXref,
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextRepositoryXref,
  calculateNextSourceXref,
  calculateNextSubmitterXref,
} from "../../util/next-xref";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  GEDCOM_EDITOR,
  type GedcomEditorInterface,
  type TabInformation,
} from "./gedcom-editor-interface";
import { InputFamilyComponent } from "./input-family.component";
import { InputIndividualComponent } from "./input-individual.component";
import { InputMultimediaComponent } from "./input-multimedia.component";
import { InputRepositoryComponent } from "./input-repository.component";
import { InputSourceComponent } from "./input-source.component";

@Component({
  selector: "app-gedcom-editor",
  imports: [
    FormField,
    GedcomDiffComponent,
    InputFamilyComponent,
    InputIndividualComponent,
    InputMultimediaComponent,
    InputRepositoryComponent,
    InputSourceComponent,
  ],
  providers: [{ provide: GEDCOM_EDITOR, useExisting: GedcomEditorComponent }],
  templateUrl: "./gedcom-editor.component.html",
  styleUrl: "./gedcom-editor.component.css",
})
export class GedcomEditorComponent implements GedcomEditorInterface {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // The tabs to open the editor with. The first is the one shown by
  // default; an empty xref on any of them means "create a new record of
  // this type" (its xref is calculated once resolved).
  readonly tabs = input.required<TabInformation[]>();
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly finished = output();

  // `tabs()` with each xref resolved: an empty xref means "create a new
  // record of this type," so we calculate the next available xref for it.
  readonly effectiveTabs = computed<TabInformation[]>(() => {
    const database = this.ancestryDatabase();
    return this.tabs().map((tab): TabInformation => {
      if (tab.xref) return tab;
      switch (tab.type) {
        case "INDI":
          return { type: "INDI", xref: calculateNextIndividualXref(database) };
        case "SOUR":
          return { type: "SOUR", xref: calculateNextSourceXref(database) };
        case "OBJE":
          return { type: "OBJE", xref: calculateNextMultimediaXref(database) };
        case "REPO":
          return { type: "REPO", xref: calculateNextRepositoryXref(database) };
        case "FAM":
          return { type: "FAM", xref: calculateNextFamilyXref(database) };
        case "SUBM":
          return { type: "SUBM", xref: calculateNextSubmitterXref(database) };
      }
    });
  });

  // The GedcomDatabase that the form will be manipulating and editing.
  // When the editor completes successfully, we will persist this instance of the database.
  // If the user provides an xref that is not present in the database (or an empty string), we should instantiate a new object.
  readonly workingDatabase = linkedSignal<GedcomDatabase>(() => {
    const tabs = this.effectiveTabs();
    return produce(this.ancestryDatabase(), (draft) => {
      for (const tab of tabs) {
        const xref = tab.xref;
        switch (tab.type) {
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
      }
    });
  });

  // The set of xrefs that are currently being modified by the form.
  // - Adding an xref to the set will cause it to be included in the form.
  // - Removing an xref from the set will cause it to be removed from the
  //   form, but any changes made will be maintained in workingDatabase().
  readonly xrefsIncludedInView = linkedSignal<TabInformation[]>(() =>
    this.effectiveTabs(),
  );

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
        this.workingDatabase.update((database) =>
          produce(database, (draft) => {
            Object.assign(draft.submitters, updates.submitters);
            Object.assign(draft.individuals, updates.individuals);
            Object.assign(draft.families, updates.families);
            Object.assign(draft.sources, updates.sources);
            Object.assign(draft.repositories, updates.repositories);
            Object.assign(draft.multimedias, updates.multimedias);
          }),
        );
      },
    },
  );

  readonly form = form(this.workingDatabaseView);

  readonly differences = computed(() => {
    // Every record currently open as a tab should show its Gedcom, even if
    // the user hasn't changed anything -- otherwise opening an unedited
    // record just hides the Gedcom Delta section entirely. Records outside
    // the view only show up here when they genuinely differ (e.g. an
    // incidental header DATE/VERS stamp, or another tab's edits).
    const viewXrefs = new Set(
      this.xrefsIncludedInView().map((tab) => tab.xref),
    );
    return this.ancestryService.gedcomDatabaseDifferences(
      this.workingDatabase(),
      viewXrefs,
    );
  });

  readonly activeTab = linkedSignal<TabInformation | undefined>(
    () => this.effectiveTabs()[0],
  );

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

  openNewFamily(): string {
    const xref = calculateNextFamilyXref(this.workingDatabase());
    this.openTab({ type: "FAM", xref });
    return xref;
  }

  openFamily(xref: string) {
    this.openTab({ type: "FAM", xref });
  }

  openTab(tabInformation: TabInformation) {
    const xref = tabInformation.xref;
    // Create a new record in the database if one didn't already exist.
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
        return individual?.names[0]
          ? displayGedcomName(individual.names[0])
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

  // Files picked from outside the data folder, by multimedia xref. They're
  // copied in on submit, so cancelling the editor leaves the folder as is.
  private readonly pendingMultimediaFiles = signal<ReadonlyMap<string, File>>(
    new Map(),
  );

  pendingMultimediaFile(xref: string): File | undefined {
    return this.pendingMultimediaFiles().get(xref);
  }

  setPendingMultimediaFile(xref: string, file: File | undefined) {
    this.pendingMultimediaFiles.update((files) => {
      const updated = new Map(files);
      if (file) {
        updated.set(xref, file);
      } else {
        updated.delete(xref);
      }
      return updated;
    });
  }

  // Each pending file with the path in the data folder it will be copied
  // to on submit (its multimedia record's current file path). Shown
  // alongside the GEDCOM delta, since it's part of what submit writes.
  readonly pendingMultimediaCopies = computed(() =>
    [...this.pendingMultimediaFiles()].flatMap(([xref, file]) => {
      const filePath = this.workingDatabase().multimedias[xref]?.filePath;
      return filePath === undefined ? [] : [{ file, filePath }];
    }),
  );

  // Files a multimedia record linked to before this edit but won't after
  // it. Submit never deletes them; they're listed alongside the GEDCOM delta
  // so it's clear they stay in the data folder, and whether any other
  // record still links to them.
  readonly unlinkedMultimediaFiles = computed(() => {
    const original = this.ancestryDatabase().multimedias;
    const working = Object.values(this.workingDatabase().multimedias);
    return Object.values(original).flatMap((multimedia) => {
      const oldPath = multimedia.filePath;
      const updated = working.find((m) => m.xref === multimedia.xref);
      if (!oldPath || updated?.filePath === oldPath) {
        return [];
      }
      const stillLinkedFrom = working
        .filter((m) => m.filePath === oldPath)
        .map((m) => m.xref.replace(/^@(.*)@$/, "$1"));
      return [{ xref: multimedia.xref, oldPath, stillLinkedFrom }];
    });
  });

  // Copies each pending file to its record's file path. Checks them all
  // first, so a bad or taken path stops the save before anything is
  // written. Returns whether the save should go ahead.
  private async copyPendingMultimediaFiles(): Promise<boolean> {
    const copies = this.pendingMultimediaCopies();
    for (const { filePath } of copies) {
      const problem =
        multimediaFilePathProblem(filePath) ??
        ((await this.ancestryService.multimediaFileExists(filePath))
          ? `"${filePath}" already exists in the data folder.`
          : undefined);
      if (problem) {
        alert(`Can't copy multimedia to "${filePath}": ${problem}`);
        return false;
      }
    }
    for (const { file, filePath } of copies) {
      await this.ancestryService.copyMultimediaFile(file, filePath);
    }
    this.pendingMultimediaFiles.set(new Map());
    return true;
  }

  hasUnsavedChanges(): boolean {
    // Signal Forms only marks a field (and the form's own aggregate dirty
    // flag) dirty in response to a real control-originated value change --
    // typing into a bound input, or a custom FormValueControl emitting a
    // new value -- not in response to a programmatic signal update like
    // workingDatabase.update() in openTab(). That makes it the right
    // signal for "did the user actually change anything", unlike
    // differences() (which also reflects unrelated, by-design differences
    // between the working database and the file on disk, such as the
    // header getting a fresh DATE/VERS stamp on every save).
    return this.form().dirty();
  }

  async submitForm(event: Event) {
    // Without this, the native <form> falls back to its default submit
    // behavior -- a real browser navigation to the current URL -- which
    // races the async save below and trips the browser's own
    // beforeunload prompt (GedcomEditorDialogComponent.onBeforeUnload)
    // before the save has finished.
    event.preventDefault();
    if (!(await this.copyPendingMultimediaFiles())) {
      return;
    }
    await this.ancestryService.updateGedcomDatabase(this.workingDatabase());
    // Close the dialog before the reload navigation below: the unsaved-changes
    // guard checks whether the dialog is still open, and the just-saved
    // database hasn't reached this component's `ancestryDatabase` input yet
    // (that's what the reload is for), so differences() would still look
    // unsaved if the guard ran while the dialog is still open.
    this.finished.emit();
    await this.router.navigate([], {
      relativeTo: this.route,
      onSameUrlNavigation: "reload",
      skipLocationChange: true,
    });
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
