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
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSubmitter } from "../../gedcom/gedcomSubmitter";
import {
  calculateNextFamilyXref,
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextRepositoryXref,
  calculateNextSourceXref,
  calculateNextSubmitterXref,
} from "../../util/next-xref";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { deleteGedcomRecord } from "./delete-gedcom-record.util";
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

  readonly activeTab = linkedSignal<TabInformation | undefined>(
    () => this.effectiveTabs()[0],
  );

  // deleteRecord() removes a record (and any references to it) from
  // workingDatabase() directly, bypassing the Signal Forms form -- the same
  // way openTab() creates a new record -- so it never flips form().dirty().
  // Track it separately so hasUnsavedChanges() still reports a pending
  // deletion as an unsaved change.
  private readonly hasDeletedRecords = signal(false);

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
        return "multimedia item";
      case "SUBM":
        return "submitter";
    }
  }

  deleteRecord(tabInformation: TabInformation) {
    const confirmed = confirm(
      `Delete this ${this.deleteRecordLabel(tabInformation)}? Any records ` +
        "that reference it will be updated to no longer reference it. " +
        "This cannot be undone once saved.",
    );
    if (!confirmed) return;

    this.workingDatabase.update((workingDatabase) =>
      deleteGedcomRecord(workingDatabase, tabInformation),
    );
    this.hasDeletedRecords.set(true);

    this.xrefsIncludedInView.update((xrefsIncludedInView) =>
      xrefsIncludedInView.filter(
        (other) =>
          !(
            other.type === tabInformation.type &&
            other.xref === tabInformation.xref
          ),
      ),
    );

    if (
      this.activeTab()?.type === tabInformation.type &&
      this.activeTab()?.xref === tabInformation.xref
    ) {
      // The deleted tab is already gone from xrefsIncludedInView() above, so
      // its first entry (if any) is simply whichever tab should become active.
      this.activeTab.set(this.xrefsIncludedInView()[0]);
    }
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

  hasUnsavedChanges(): boolean {
    // Signal Forms only marks a field (and the form's own aggregate dirty
    // flag) dirty in response to a real control-originated value change --
    // typing into a bound input, or a custom FormValueControl emitting a
    // new value -- not in response to a programmatic signal update like
    // workingDatabase.update() in openTab(). That makes it the right
    // signal for "did the user actually change anything", unlike
    // differences() (which also reflects unrelated, by-design differences
    // between the working database and the file on disk, such as the
    // header getting a fresh DATE/VERS stamp on every save). deleteRecord()
    // updates workingDatabase() the same programmatic way, so it can't flip
    // form().dirty() either -- hasDeletedRecords() covers that case.
    return this.form().dirty() || this.hasDeletedRecords();
  }

  async submitForm(event: Event) {
    // Without this, the native <form> falls back to its default submit
    // behavior -- a real browser navigation to the current URL -- which
    // races the async save below and trips the browser's own
    // beforeunload prompt (GedcomEditorDialogComponent.onBeforeUnload)
    // before the save has finished.
    event.preventDefault();
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
