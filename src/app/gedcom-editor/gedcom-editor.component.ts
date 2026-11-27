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
import {
  diffGedcomDatabase,
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
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

  // `tabs()` with each empty xref resolved to the next available xref for
  // a new record of that type.
  private readonly initialTabs = computed(() => {
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

  // The records open as tabs in the editor: initialTabs(), plus any opened
  // later with openTab().
  readonly openTabs = linkedSignal(() => this.initialTabs());

  // The GedcomDatabase that the form edits, and that submitting saves. It
  // starts from ancestryDatabase(), with a new record for each of
  // initialTabs() that isn't in it yet. The openNew*() methods add the
  // records they create.
  readonly workingDatabase = linkedSignal(() =>
    withNewRecords(this.ancestryDatabase(), this.initialTabs()),
  );

  // The records deleted in this session. Deleting moves a record out of
  // workingDatabase() into here, and undoDelete() moves it back with its
  // edits. Its tab stays open, showing a "Deleted" card instead of a form.
  // It starts over empty whenever the file is reloaded.
  readonly deletedDatabase = linkedSignal<GedcomDatabase>(() => {
    this.ancestryDatabase();
    return newGedcomDatabase();
  });

  // Signal Forms only creates a field node when something reads it, so this
  // costs nothing for records that aren't open. That relies on
  // patches/@angular+forms+*.patch until angular/angular#70627 is
  // fixed; without it, the form builds a node for every field in the file.
  readonly form = form(this.workingDatabase);

  readonly differences = computed(() => {
    // Every record currently open as a tab should show its Gedcom, even if
    // the user hasn't changed anything -- otherwise opening an unedited
    // record just hides the Gedcom Delta section entirely. Records that
    // aren't open only show up here when they genuinely differ (e.g. an
    // incidental header DATE/VERS stamp, or another tab's edits).
    const openXrefs = new Set(this.openTabs().map((tab) => tab.xref));
    const gedcom = this.ancestryService.gedcomResource.value();
    return diffGedcomDatabase(
      gedcom?.gedcomRecords ?? [],
      gedcom?.gedcomDatabase ?? newGedcomDatabase(),
      this.workingDatabase(),
      openXrefs,
    );
  });

  readonly activeTab = linkedSignal<TabInformation | undefined>(
    () => this.openTabs()[0],
  );

  openNewIndividual(): string {
    const xref = calculateNextIndividualXref(this.workingDatabase());
    this.openNewTab({ type: "INDI", xref });
    return xref;
  }

  openIndividual(xref: string) {
    this.openTab({ type: "INDI", xref });
  }

  openNewMultimedia(): string {
    const xref = calculateNextMultimediaXref(this.workingDatabase());
    this.openNewTab({ type: "OBJE", xref });
    return xref;
  }

  openMultimedia(xref: string) {
    this.openTab({ type: "OBJE", xref });
  }

  openNewRepository(): string {
    const xref = calculateNextRepositoryXref(this.workingDatabase());
    this.openNewTab({ type: "REPO", xref });
    return xref;
  }

  openRepository(xref: string) {
    this.openTab({ type: "REPO", xref });
  }

  openNewSource(): string {
    const xref = calculateNextSourceXref(this.workingDatabase());
    this.openNewTab({ type: "SOUR", xref });
    return xref;
  }

  openSource(xref: string) {
    this.openTab({ type: "SOUR", xref });
  }

  openNewFamily(): string {
    const xref = calculateNextFamilyXref(this.workingDatabase());
    this.openNewTab({ type: "FAM", xref });
    return xref;
  }

  openFamily(xref: string) {
    this.openTab({ type: "FAM", xref });
  }

  private openNewTab(tabInformation: TabInformation) {
    this.workingDatabase.update((database) =>
      withNewRecords(database, [tabInformation]),
    );
    this.openTab(tabInformation);
  }

  openTab(tabInformation: TabInformation) {
    // Include the xref in the list of editable tabs.
    if (
      !this.openTabs().some(
        (other) =>
          other.type == tabInformation.type &&
          other.xref == tabInformation.xref,
      )
    ) {
      this.openTabs.update((openTabs) => [...openTabs, tabInformation]);
    }

    // Switch to this xref's tab.
    this.activeTab.set(tabInformation);
  }

  deleteRecordLabel(tabInformation: TabInformation): string {
    switch (tabInformation.type) {
      case "INDI":
        return "individual";
      case "FAM":
        return "family";
      case "SOUR":
        return "source";
      case "REPO":
        return "repository";
      case "OBJE":
        return "multimedia";
      case "SUBM":
        return "submitter";
    }
  }

  isDeleted(tab: TabInformation): boolean {
    return findRecord(this.deletedDatabase(), tab) !== undefined;
  }

  // Moves the record out of workingDatabase() into deletedDatabase(). Its
  // tab stays open, so undoDelete() can bring it back. Deleting a family
  // also takes it out of its members' FAMS/FAMC, and undo adds it back.
  deleteRecord({ type, xref }: TabInformation) {
    const result = produce(
      { working: this.workingDatabase(), deleted: this.deletedDatabase() },
      ({ working, deleted }) => {
        /* eslint-disable @typescript-eslint/no-dynamic-delete */
        switch (type) {
          case "INDI": {
            const record = working.individuals[xref];
            if (!record) return;
            deleted.individuals[xref] = record;
            delete working.individuals[xref];
            break;
          }
          case "FAM": {
            const family = working.families[xref];
            if (!family) return;
            // Its members' FAMS/FAMC mirror its HUSB/WIFE/CHIL. A member
            // may be deleted too, and keeps its links right for its undo.
            for (const spouseXref of [family.husbandXref, family.wifeXref]) {
              const spouse =
                working.individuals[spouseXref] ??
                deleted.individuals[spouseXref];
              if (spouse)
                spouse.parentOfFamilyXrefs = spouse.parentOfFamilyXrefs.filter(
                  (linked) => linked !== xref,
                );
            }
            for (const childXref of family.childXrefs) {
              const child =
                working.individuals[childXref] ??
                deleted.individuals[childXref];
              if (child)
                child.childOfFamilyXrefs = child.childOfFamilyXrefs.filter(
                  (linked) => linked !== xref,
                );
            }
            deleted.families[xref] = family;
            delete working.families[xref];
            break;
          }
          case "SOUR": {
            const record = working.sources[xref];
            if (!record) return;
            deleted.sources[xref] = record;
            delete working.sources[xref];
            break;
          }
          case "REPO": {
            const record = working.repositories[xref];
            if (!record) return;
            deleted.repositories[xref] = record;
            delete working.repositories[xref];
            break;
          }
          case "OBJE": {
            const record = working.multimedias[xref];
            if (!record) return;
            deleted.multimedias[xref] = record;
            delete working.multimedias[xref];
            break;
          }
          case "SUBM": {
            const record = working.submitters[xref];
            if (!record) return;
            deleted.submitters[xref] = record;
            delete working.submitters[xref];
            break;
          }
        }
        /* eslint-enable @typescript-eslint/no-dynamic-delete */
      },
    );
    this.workingDatabase.set(result.working);
    this.deletedDatabase.set(result.deleted);
  }

  undoDelete({ type, xref }: TabInformation) {
    const result = produce(
      { working: this.workingDatabase(), deleted: this.deletedDatabase() },
      ({ working, deleted }) => {
        /* eslint-disable @typescript-eslint/no-dynamic-delete */
        switch (type) {
          case "INDI": {
            const record = deleted.individuals[xref];
            if (!record) return;
            working.individuals[xref] = record;
            delete deleted.individuals[xref];
            break;
          }
          case "FAM": {
            const family = deleted.families[xref];
            if (!family) return;
            // Its members' FAMS/FAMC mirror its HUSB/WIFE/CHIL. A member
            // may be deleted too, and keeps its links right for its undo.
            for (const spouseXref of [family.husbandXref, family.wifeXref]) {
              const spouse =
                working.individuals[spouseXref] ??
                deleted.individuals[spouseXref];
              if (spouse && !spouse.parentOfFamilyXrefs.includes(xref))
                spouse.parentOfFamilyXrefs.push(xref);
            }
            for (const childXref of family.childXrefs) {
              const child =
                working.individuals[childXref] ??
                deleted.individuals[childXref];
              if (child && !child.childOfFamilyXrefs.includes(xref))
                child.childOfFamilyXrefs.push(xref);
            }
            working.families[xref] = family;
            delete deleted.families[xref];
            break;
          }
          case "SOUR": {
            const record = deleted.sources[xref];
            if (!record) return;
            working.sources[xref] = record;
            delete deleted.sources[xref];
            break;
          }
          case "REPO": {
            const record = deleted.repositories[xref];
            if (!record) return;
            working.repositories[xref] = record;
            delete deleted.repositories[xref];
            break;
          }
          case "OBJE": {
            const record = deleted.multimedias[xref];
            if (!record) return;
            working.multimedias[xref] = record;
            delete deleted.multimedias[xref];
            break;
          }
          case "SUBM": {
            const record = deleted.submitters[xref];
            if (!record) return;
            working.submitters[xref] = record;
            delete deleted.submitters[xref];
            break;
          }
        }
        /* eslint-enable @typescript-eslint/no-dynamic-delete */
      },
    );
    this.workingDatabase.set(result.working);
    this.deletedDatabase.set(result.deleted);
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
    // A deleted tab keeps its label, so look in deletedDatabase() too.
    const working = this.workingDatabase();
    const deleted = this.deletedDatabase();
    const xref = tabInformation.xref;
    switch (tabInformation.type) {
      case "INDI": {
        const individual =
          working.individuals[xref] ?? deleted.individuals[xref];
        return individual?.names[0]
          ? displayGedcomName(individual.names[0])
          : `Individual ${xref}`;
      }
      case "FAM": {
        return `Family ${xref}`;
      }
      case "SOUR": {
        const source = working.sources[xref] ?? deleted.sources[xref];
        return source?.abbr || source?.title || `Source ${xref}`;
      }
      case "REPO": {
        const repository =
          working.repositories[xref] ?? deleted.repositories[xref];
        return repository?.name || `Repository ${xref}`;
      }
      case "OBJE": {
        const multimedia =
          working.multimedias[xref] ?? deleted.multimedias[xref];
        return (
          multimedia?.title || multimedia?.filePath || `Multimedia ${xref}`
        );
      }
      case "SUBM": {
        const submitter = working.submitters[xref] ?? deleted.submitters[xref];
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
    // workingDatabase.update() in openNewTab(). That makes it the right
    // signal for "did the user actually change anything", unlike
    // differences() (which also reflects unrelated, by-design differences
    // between the working database and the file on disk, such as the
    // header getting a fresh DATE/VERS stamp on every save). A delete
    // removes the record's form fields, so deletes are checked separately.
    return (
      this.form().dirty() ||
      Object.values(recordsKeys).some(
        (key) => Object.keys(this.deletedDatabase()[key]).length !== 0,
      )
    );
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

// Which of a GedcomDatabase's maps holds each type of record.
const recordsKeys = {
  INDI: "individuals",
  FAM: "families",
  SOUR: "sources",
  REPO: "repositories",
  OBJE: "multimedias",
  SUBM: "submitters",
} as const satisfies Record<TabInformation["type"], keyof GedcomDatabase>;

type GedcomRecordOfAnyType =
  GedcomDatabase[(typeof recordsKeys)[keyof typeof recordsKeys]][string];

function findRecord(
  database: GedcomDatabase,
  { type, xref }: TabInformation,
): GedcomRecordOfAnyType | undefined {
  return database[recordsKeys[type]][xref];
}

// Adds an empty record for each tab whose xref isn't in the database yet.
function withNewRecords(
  database: GedcomDatabase,
  tabs: readonly TabInformation[],
): GedcomDatabase {
  return produce(database, (draft) => {
    for (const { type, xref } of tabs) {
      switch (type) {
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
}
