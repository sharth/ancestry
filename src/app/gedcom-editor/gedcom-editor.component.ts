import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from "@angular/core";
import {
  FormField,
  type ValidationError,
  applyEach,
  disabled,
  form,
  validate,
} from "@angular/forms/signals";
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
import { syncFamilyLinks } from "../../util/family-links";
import { FileExistsError } from "../../util/file-system";
import {
  xrefsLinkedFromFamily,
  xrefsLinkedFromIndividual,
  xrefsLinkedFromSource,
} from "../../util/linked-xrefs";
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

  // The records open as tabs in the editor: `tabs()` with each xref
  // resolved, plus any opened later with openTab(). An empty xref means
  // "create a new record of this type," so we calculate the next available
  // xref for it.
  readonly openTabs = linkedSignal<TabInformation[]>(() => {
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

  // The GedcomDatabase that the form edits, and that submitting saves. It
  // starts from ancestryDatabase(), with a new record for each open tab
  // whose xref isn't in it yet. Opening another tab keeps the edits made so
  // far and only adds that tab's record.
  readonly workingDatabase = linkedSignal<
    { database: GedcomDatabase; tabs: TabInformation[] },
    GedcomDatabase
  >({
    source: () => ({
      database: this.ancestryDatabase(),
      tabs: this.openTabs(),
    }),
    computation: ({ database, tabs }, previous) => {
      const base =
        previous?.source.database === database ? previous.value : database;
      return produce(base, (draft) => {
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
    },
  });

  // Records deleted in this session. They stay in workingDatabase() (so
  // their xrefs aren't handed out again, and undo keeps their edits) and
  // keep their tabs, disabled under a "Deleted" overlay. savedDatabase()
  // leaves them out.
  readonly deletedTabs = signal<TabInformation[]>([]);
  readonly deletedXrefs = computed(
    () => new Set(this.deletedTabs().map((tab) => tab.xref)),
  );

  // For each xref, the records in the file that link to it. Built from the
  // file as loaded, not the working copy, so it's only built once (and only
  // once something is deleted). It only picks out candidates among records
  // that aren't open; each is rechecked against its working copy.
  private readonly fileReferrers = computed(() => {
    const index = new Map<string, TabInformation[]>();
    const add = (referrer: TabInformation, xrefs: Iterable<string>) => {
      for (const xref of new Set(xrefs)) {
        index.set(xref, [...(index.get(xref) ?? []), referrer]);
      }
    };
    const database = this.ancestryDatabase();
    for (const individual of Object.values(database.individuals)) {
      add(
        { type: "INDI", xref: individual.xref },
        xrefsLinkedFromIndividual(individual),
      );
    }
    for (const family of Object.values(database.families)) {
      add({ type: "FAM", xref: family.xref }, xrefsLinkedFromFamily(family));
    }
    for (const source of Object.values(database.sources)) {
      add({ type: "SOUR", xref: source.xref }, xrefsLinkedFromSource(source));
    }
    return index;
  });

  // Records that aren't open but still link to a deleted record. Their
  // form fields may never be created, so the form's root validator reports
  // them, and the overlay offers to open them.
  private readonly unopenedReferrers = computed(() => {
    const deleted = this.deletedXrefs();
    const result = new Map<string, TabInformation[]>();
    if (deleted.size === 0) return result;
    const opened = new Set(this.openTabs().map((tab) => tab.xref));
    for (const xref of deleted) {
      const referrers = (this.fileReferrers().get(xref) ?? []).filter(
        (referrer) =>
          !opened.has(referrer.xref) &&
          !deleted.has(referrer.xref) &&
          this.currentlyLinks(referrer, xref),
      );
      if (referrers.length > 0) result.set(xref, referrers);
    }
    return result;
  });

  // Whether the working copy of `referrer` still links to `xref` (a record
  // that isn't open can still be edited through another one's form).
  private currentlyLinks(referrer: TabInformation, xref: string): boolean {
    const database = this.workingDatabase();
    let linked: Iterable<string> = [];
    switch (referrer.type) {
      case "INDI": {
        const individual = database.individuals[referrer.xref];
        if (individual) linked = xrefsLinkedFromIndividual(individual);
        break;
      }
      case "FAM": {
        const family = database.families[referrer.xref];
        if (family) linked = xrefsLinkedFromFamily(family);
        break;
      }
      case "SOUR": {
        const source = database.sources[referrer.xref];
        if (source) linked = xrefsLinkedFromSource(source);
        break;
      }
      case "REPO":
      case "OBJE":
      case "SUBM":
        // These don't link to other records.
        break;
    }
    return Iterator.from(linked).some((linkedXref) => linkedXref === xref);
  }

  // Signal Forms only creates a field node when something reads it, so this
  // costs nothing for records that aren't open. That relies on
  // patches/@angular+forms+*.patch until angular/angular#70627 is
  // fixed; without it, the form builds a node for every field in the file.
  readonly form = form(this.workingDatabase, (database) => {
    // A deleted record's form is disabled. An open record that still links
    // to a deleted one is invalid, which blocks saving. Records that aren't
    // open are checked by the root validator below instead, so these only
    // look at open records.
    applyEach(database.individuals, (individual) => {
      disabled(individual, { when: ({ key }) => this.isDeleted(key()) });
      validate(individual, ({ key, value }) =>
        this.openRecordLinkErrors({ type: "INDI", xref: key() }, () =>
          xrefsLinkedFromIndividual(value()),
        ),
      );
    });
    applyEach(database.families, (family) => {
      disabled(family, { when: ({ key }) => this.isDeleted(key()) });
      validate(family, ({ key, value }) =>
        this.openRecordLinkErrors({ type: "FAM", xref: key() }, () =>
          xrefsLinkedFromFamily(value()),
        ),
      );
    });
    applyEach(database.sources, (source) => {
      disabled(source, { when: ({ key }) => this.isDeleted(key()) });
      validate(source, ({ key, value }) =>
        this.openRecordLinkErrors({ type: "SOUR", xref: key() }, () =>
          xrefsLinkedFromSource(value()),
        ),
      );
    });
    applyEach(database.repositories, (repository) => {
      disabled(repository, { when: ({ key }) => this.isDeleted(key()) });
    });
    applyEach(database.multimedias, (multimedia) => {
      disabled(multimedia, { when: ({ key }) => this.isDeleted(key()) });
    });
    validate(database, () =>
      [...this.unopenedReferrers()].flatMap(([xref, referrers]) =>
        referrers.map((referrer) => this.deletedLinkError(referrer, xref)),
      ),
    );
  });

  private isDeleted(xref: string): boolean {
    return this.deletedXrefs().has(xref);
  }

  // Returns early, before reading the record's value, when nothing is
  // deleted or the record isn't open.
  private openRecordLinkErrors(
    referrer: TabInformation,
    linkedXrefs: () => Iterable<string>,
  ): DeletedLinkError[] {
    const deleted = this.deletedXrefs();
    if (deleted.size === 0 || deleted.has(referrer.xref)) return [];
    if (!this.openTabs().some((tab) => tab.xref === referrer.xref)) return [];
    return [...new Set(linkedXrefs())]
      .filter((xref) => deleted.has(xref))
      .map((xref) => this.deletedLinkError(referrer, xref));
  }

  private deletedLinkError(
    referrer: TabInformation,
    xref: string,
  ): DeletedLinkError {
    const deletedTab = this.deletedTabs().find((tab) => tab.xref === xref);
    const deletedName = deletedTab
      ? `${this.deleteRecordLabel(deletedTab)} ${this.tabLabel(deletedTab)}`
      : xref;
    return {
      kind: "deletedLink",
      message: `${this.tabLabel(referrer)} still links to deleted ${deletedName}.`,
      referrer,
      deletedXref: xref,
    };
  }

  // The records that still link to a deleted record, read back from the
  // form's validation errors, for the deleted tab's overlay.
  readonly referrersOfDeleted = computed(() => {
    const result = new Map<string, TabInformation[]>();
    for (const error of this.form().errorSummary()) {
      if (!isDeletedLinkError(error)) continue;
      result.set(error.deletedXref, [
        ...(result.get(error.deletedXref) ?? []),
        error.referrer,
      ]);
    }
    return result;
  });

  // What submit writes: workingDatabase() without the deleted records, and
  // with each individual's FAMS/FAMC brought in line with the families'
  // HUSB/WIFE/CHIL. The family editor owns membership, and FAMS/FAMC aren't
  // edited directly. A deleted family counts as removed, so its members'
  // links to it go too.
  readonly savedDatabase = computed(() =>
    syncFamilyLinks(this.ancestryDatabase(), this.withoutDeletedRecords()),
  );

  private readonly withoutDeletedRecords = computed<GedcomDatabase>(() => {
    const deleted = this.deletedXrefs();
    if (deleted.size === 0) return this.workingDatabase();
    return produce(this.workingDatabase(), (draft) => {
      /* eslint-disable @typescript-eslint/no-dynamic-delete */
      for (const xref of deleted) {
        delete draft.submitters[xref];
        delete draft.individuals[xref];
        delete draft.families[xref];
        delete draft.sources[xref];
        delete draft.repositories[xref];
        delete draft.multimedias[xref];
      }
      /* eslint-enable @typescript-eslint/no-dynamic-delete */
    });
  });

  readonly differences = computed(() => {
    // Every record currently open as a tab should show its Gedcom, even if
    // the user hasn't changed anything -- otherwise opening an unedited
    // record just hides the Gedcom Delta section entirely. Records that
    // aren't open only show up here when they genuinely differ (e.g. an
    // incidental header DATE/VERS stamp, or another tab's edits).
    const openXrefs = new Set(this.openTabs().map((tab) => tab.xref));
    return this.ancestryService.gedcomDatabaseDifferences(
      this.savedDatabase(),
      openXrefs,
    );
  });

  readonly activeTab = linkedSignal<TabInformation | undefined>(
    () => this.openTabs()[0],
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
    // Adding the tab also gives workingDatabase() a new record for it, if
    // it doesn't have one.
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

  // Marks the record deleted. Nothing else changes, so undoDelete()
  // brings it back with any edits made to it.
  deleteRecord(tabInformation: TabInformation) {
    if (this.deletedXrefs().has(tabInformation.xref)) return;
    this.deletedTabs.update((tabs) => [...tabs, tabInformation]);
  }

  undoDelete(tabInformation: TabInformation) {
    this.deletedTabs.update((tabs) =>
      tabs.filter((tab) => tab.xref !== tabInformation.xref),
    );
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
    Object.values(this.savedDatabase().multimedias).filter(
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
    const working = Object.values(this.savedDatabase().multimedias);
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
    // header getting a fresh DATE/VERS stamp on every save). Deleting a
    // record doesn't change any field, so it's checked separately.
    return this.form().dirty() || this.deletedTabs().length > 0;
  }

  async submitForm(event: Event) {
    // Without this, the native <form> falls back to its default submit
    // behavior -- a real browser navigation to the current URL -- which
    // races the async save below and trips the browser's own
    // beforeunload prompt (GedcomEditorDialogComponent.onBeforeUnload)
    // before the save has finished.
    event.preventDefault();
    // Validators block saving while anything links to a deleted record.
    if (this.form().invalid()) return;
    // Any failure (a taken path, a write error) leaves the dialog open with
    // the edits intact, so the user can fix it and submit again.
    try {
      await this.copyPendingMultimediaFiles();
      await this.ancestryService.updateGedcomDatabase(this.savedDatabase());
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

interface DeletedLinkError extends ValidationError {
  kind: "deletedLink";
  referrer: TabInformation;
  deletedXref: string;
}

function isDeletedLinkError(error: ValidationError): error is DeletedLinkError {
  return error.kind === "deletedLink";
}
