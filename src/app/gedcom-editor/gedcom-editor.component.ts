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
import { produce } from "immer";

import { AncestryService } from "../../database/ancestry.service";
import {
  diffGedcomDatabase,
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { type GedcomFamily, newGedcomFamily } from "../../gedcom/gedcomFamily";
import {
  type GedcomIndividual,
  newGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import {
  type GedcomMultimedia,
  newGedcomMultimedia,
} from "../../gedcom/gedcomMultimedia";
import { displayGedcomName } from "../../gedcom/gedcomName";
import {
  type GedcomRepository,
  newGedcomRepository,
} from "../../gedcom/gedcomRepository";
import { type GedcomSource, newGedcomSource } from "../../gedcom/gedcomSource";
import {
  type GedcomSubmitter,
  newGedcomSubmitter,
} from "../../gedcom/gedcomSubmitter";
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

  // Records deleted in this session, by xref. Deleting moves a record out of
  // workingDatabase() into here, and undoDelete() moves it back with its
  // edits. Its tab stays open, showing a "Deleted" card instead of a form.
  readonly deletedRecords = signal<ReadonlyMap<string, DeletedRecord>>(
    new Map(),
  );

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

  // Moves the record out of workingDatabase() into deletedRecords(). Its
  // tab stays open, so undoDelete() can bring it back. A family's members'
  // FAMS/FAMC mirror its HUSB/WIFE/CHIL, so deleting a family also takes it
  // out of their links, and undo puts it back where it was.
  deleteRecord(tab: TabInformation) {
    const record = findRecord(this.workingDatabase(), tab);
    if (!record) return;
    const memberLinks: MemberLink[] = [];
    this.workingDatabase.update(
      produce((draft) => {
        if (tab.type === "FAM") {
          const family = record as GedcomFamily;
          const members = [
            ...[family.husbandXref, family.wifeXref].map(
              (xref) => ({ xref, links: "parentOfFamilyXrefs" }) as const,
            ),
            ...family.childXrefs.map(
              (xref) => ({ xref, links: "childOfFamilyXrefs" }) as const,
            ),
          ];
          for (const { xref, links } of members) {
            const member = draft.individuals[xref];
            const index = member?.[links].indexOf(tab.xref) ?? -1;
            if (member && index >= 0) {
              member[links] = member[links].toSpliced(index, 1);
              memberLinks.push({ xref, links, index });
            }
          }
        }
        /* eslint-disable @typescript-eslint/no-dynamic-delete */
        switch (tab.type) {
          case "INDI":
            delete draft.individuals[tab.xref];
            break;
          case "FAM":
            delete draft.families[tab.xref];
            break;
          case "SOUR":
            delete draft.sources[tab.xref];
            break;
          case "REPO":
            delete draft.repositories[tab.xref];
            break;
          case "OBJE":
            delete draft.multimedias[tab.xref];
            break;
          case "SUBM":
            delete draft.submitters[tab.xref];
            break;
        }
        /* eslint-enable @typescript-eslint/no-dynamic-delete */
      }),
    );
    this.deletedRecords.update((deleted) =>
      new Map(deleted).set(tab.xref, {
        tab,
        record,
        memberLinks,
      } as DeletedRecord),
    );
  }

  undoDelete(tab: TabInformation) {
    const deleted = this.deletedRecords().get(tab.xref);
    if (!deleted) return;
    this.workingDatabase.update((database) =>
      produce(restoreRecords(database, [deleted]), (draft) => {
        // Put the family back into its members' links, in reverse so each
        // index is where it was.
        for (const { xref, links, index } of deleted.memberLinks.toReversed()) {
          const member = draft.individuals[xref];
          if (member)
            member[links] = member[links].toSpliced(index, 0, tab.xref);
        }
      }),
    );
    this.deletedRecords.update((records) => {
      const remaining = new Map(records);
      remaining.delete(tab.xref);
      return remaining;
    });
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
    // A deleted tab keeps its label, so look in deletedRecords() too.
    const record =
      findRecord(this.workingDatabase(), tabInformation) ??
      this.deletedRecords().get(tabInformation.xref)?.record;
    const xref = tabInformation.xref;
    switch (tabInformation.type) {
      case "INDI": {
        const individual = record as GedcomIndividual | undefined;
        return individual?.names[0]
          ? displayGedcomName(individual.names[0])
          : `Individual ${xref}`;
      }
      case "FAM": {
        return `Family ${xref}`;
      }
      case "SOUR": {
        const source = record as GedcomSource | undefined;
        return source?.abbr || source?.title || `Source ${xref}`;
      }
      case "REPO": {
        const repository = record as GedcomRepository | undefined;
        return repository?.name || `Repository ${xref}`;
      }
      case "OBJE": {
        const multimedia = record as GedcomMultimedia | undefined;
        return (
          multimedia?.title || multimedia?.filePath || `Multimedia ${xref}`
        );
      }
      case "SUBM": {
        const submitter = record as GedcomSubmitter | undefined;
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
    return this.form().dirty() || this.deletedRecords().size !== 0;
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

// Where a deleted family sat in one member's FAMS or FAMC.
interface MemberLink {
  xref: string;
  links: "parentOfFamilyXrefs" | "childOfFamilyXrefs";
  index: number;
}

type DeletedRecord = { memberLinks: MemberLink[] } & (
  | { tab: TabInformation & { type: "INDI" }; record: GedcomIndividual }
  | { tab: TabInformation & { type: "FAM" }; record: GedcomFamily }
  | { tab: TabInformation & { type: "SOUR" }; record: GedcomSource }
  | { tab: TabInformation & { type: "REPO" }; record: GedcomRepository }
  | { tab: TabInformation & { type: "OBJE" }; record: GedcomMultimedia }
  | { tab: TabInformation & { type: "SUBM" }; record: GedcomSubmitter }
);

function findRecord(
  database: GedcomDatabase,
  { type, xref }: TabInformation,
): DeletedRecord["record"] | undefined {
  switch (type) {
    case "INDI":
      return database.individuals[xref];
    case "FAM":
      return database.families[xref];
    case "SOUR":
      return database.sources[xref];
    case "REPO":
      return database.repositories[xref];
    case "OBJE":
      return database.multimedias[xref];
    case "SUBM":
      return database.submitters[xref];
  }
}

function restoreRecords(
  database: GedcomDatabase,
  records: Iterable<DeletedRecord>,
): GedcomDatabase {
  const toRestore = [...records];
  if (toRestore.length === 0) return database;
  return produce(database, (draft) => {
    for (const { tab, record } of toRestore) {
      switch (tab.type) {
        case "INDI":
          draft.individuals[tab.xref] = record as GedcomIndividual;
          break;
        case "FAM":
          draft.families[tab.xref] = record as GedcomFamily;
          break;
        case "SOUR":
          draft.sources[tab.xref] = record as GedcomSource;
          break;
        case "REPO":
          draft.repositories[tab.xref] = record as GedcomRepository;
          break;
        case "OBJE":
          draft.multimedias[tab.xref] = record as GedcomMultimedia;
          break;
        case "SUBM":
          draft.submitters[tab.xref] = record as GedcomSubmitter;
          break;
      }
    }
  });
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
