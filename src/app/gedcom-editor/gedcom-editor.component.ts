import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { produce } from "immer";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import {
  type GedcomMultimedia,
  newGedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import { FileExistsError } from "../../util/file-system";
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
import { OpenExistingRecordComponent } from "./open-existing-record.component";

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
    OpenExistingRecordComponent,
  ],
  providers: [{ provide: GEDCOM_EDITOR, useExisting: GedcomEditorComponent }],
  templateUrl: "./gedcom-editor.component.html",
  styleUrl: "./gedcom-editor.component.css",
})
export class GedcomEditorComponent implements GedcomEditorInterface {
  private readonly ancestryService = inject(AncestryService);

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

  // The records open as tabs in the editor. Opening a tab adds to this;
  // every record, open or not, is editable through `form` and keeps its
  // changes in workingDatabase().
  readonly xrefsIncludedInView = linkedSignal<TabInformation[]>(() =>
    this.effectiveTabs(),
  );

  // Signal Forms only creates a field node when something reads it, so this
  // costs nothing for records that aren't open. That relies on
  // patches/@angular+forms+*.patch until angular/angular#70627 is
  // fixed; without it, the form builds a node for every field in the file.
  readonly form = form(this.workingDatabase);

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

  // Multimedia records with a pending file (see GedcomMultimedia.pendingFile)
  // that submit will copy to their file path. Shown alongside the GEDCOM
  // delta, since it's part of what submit writes.
  readonly pendingMultimedias = computed(() =>
    Object.values(this.workingDatabase().multimedias).filter(
      (multimedia): multimedia is GedcomMultimedia & { pendingFile: File } =>
        multimedia.pendingFile !== undefined,
    ),
  );

  // Files a multimedia record linked to before this edit but won't after
  // it. Submit never deletes them; they're listed alongside the GEDCOM delta
  // so it's clear they stay in the data folder, and whether any other
  // record still links to them.
  readonly unlinkedMultimediaFiles = computed<
    { xref: string; oldPath: string; stillLinkedFrom: string[] }[]
  >(() => {
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
  // first, so a bad or taken path throws before anything is written.
  private async copyPendingMultimediaFiles(): Promise<void> {
    const pending = this.pendingMultimedias();
    for (const { filePath } of pending) {
      const problem = multimediaFilePathProblem(filePath);
      if (problem) {
        throw new Error(`Can't copy multimedia to "${filePath}": ${problem}`);
      }
      if (await this.ancestryService.multimediaFileExists(filePath)) {
        throw new FileExistsError(filePath);
      }
    }
    for (const { pendingFile, filePath } of pending) {
      await this.ancestryService.copyMultimediaFile(pendingFile, filePath);
    }
    // They're in the data folder now, so don't copy them again (say, if
    // saving fails and the user submits again).
    this.workingDatabase.update((database) =>
      produce(database, (draft) => {
        for (const multimedia of Object.values(draft.multimedias)) {
          delete multimedia.pendingFile;
        }
      }),
    );
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
    // Any failure (a taken path, a write error) leaves the dialog open with
    // the edits intact, so the user can fix it and submit again.
    try {
      await this.copyPendingMultimediaFiles();
      await this.ancestryService.updateGedcomDatabase(this.workingDatabase());
    } catch (error) {
      console.error(error);
      alert(`Couldn't save: ${(error as Error).message}`);
      return;
    }
    this.finished.emit();
  }

  cancelForm() {
    this.finished.emit();
  }
}
