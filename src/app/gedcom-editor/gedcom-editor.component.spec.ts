import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { produce } from "immer";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import {
  compareGedcomDatabase,
  newGedcomDatabase,
  parseGedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomDate } from "../../gedcom/gedcomDate";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import {
  generateGedcomHeader,
  serializeGedcomHeader,
} from "../../gedcom/gedcomHeader";
import {
  newGedcomIndividual,
  serializeGedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { newGedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { newGedcomName } from "../../gedcom/gedcomName";
import {
  newGedcomRecord,
  parseGedcomRecords,
  serializeGedcomRecordToText,
} from "../../gedcom/gedcomRecord";
import { newGedcomSex } from "../../gedcom/gedcomSex";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { GedcomEditorComponent } from "./gedcom-editor.component";

describe("GedcomEditorComponent Integration", () => {
  let component: GedcomEditorComponent;
  let fixture: ComponentFixture<GedcomEditorComponent>;
  let ancestryService: AncestryService;

  const initialDatabase = newGedcomDatabase({
    individuals: {
      "@I0@": newGedcomIndividual({
        xref: "@I0@",
        names: [newGedcomName({ givenName: "Stock", surname: "Individual" })],
        sex: newGedcomSex({ sex: "M" }),
        parentOfFamilyXrefs: ["@F0@"],
      }),
    },
    families: {
      "@F0@": newGedcomFamily({
        xref: "@F0@",
        husbandXref: "@I0@",
      }),
    },
  });

  beforeEach(async () => {
    const renderResult = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    ancestryService = TestBed.inject(AncestryService);

    fixture.componentRef.setInput("tabs", [{ type: "INDI", xref: "" }]);
    fixture.componentRef.setInput("ancestryDatabase", initialDatabase);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("differences tests", () => {
    // AncestryService.compareGedcomDatabase() diffs against whatever GEDCOM
    // file is currently loaded (nothing, in this test environment), so it's
    // stubbed directly to control what differences() reports. differences()
    // still drives the Gedcom diff-review tab.
    it("reflects an empty compareGedcomDatabase result", () => {
      vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([]);
      expect(component.differences()).toEqual([]);
    });

    it("reflects a non-empty compareGedcomDatabase result", () => {
      const difference = {
        originalGedcomRecord: undefined,
        updatedGedcomRecord: undefined,
      };
      vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([
        difference,
      ]);
      expect(component.differences()).toEqual([difference]);
    });

    it("includes the open tab's record even when it is unchanged", () => {
      // The default tab (set in beforeEach) is a new individual resolved
      // to xref @I1@. Its Gedcom should still show up here even though
      // nothing differs from the file on disk, so the Gedcom tab isn't
      // hidden just because there's nothing to show as changed.
      const unchangedOpenRecord = newGedcomRecord({
        tag: "INDI",
        xref: "@I1@",
      });
      const unchangedUnrelatedRecord = newGedcomRecord({
        tag: "INDI",
        xref: "@I0@",
      });
      vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([
        {
          originalGedcomRecord: unchangedOpenRecord,
          updatedGedcomRecord: unchangedOpenRecord,
        },
        {
          originalGedcomRecord: unchangedUnrelatedRecord,
          updatedGedcomRecord: unchangedUnrelatedRecord,
        },
      ]);

      expect(component.differences()).toEqual([
        {
          originalGedcomRecord: unchangedOpenRecord,
          updatedGedcomRecord: unchangedOpenRecord,
        },
      ]);
    });
  });

  describe("hasUnsavedChanges tests", () => {
    // hasUnsavedChanges() is based on the Signal Forms "dirty" state, not
    // compareGedcomDatabase(), so it's unaffected by what that mock reports.
    it("returns false when the form hasn't been touched, even if compareGedcomDatabase reports differences", () => {
      vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([
        { originalGedcomRecord: undefined, updatedGedcomRecord: undefined },
      ]);
      expect(component.hasUnsavedChanges()).toBe(false);
    });
  });

  describe("effectiveTabs tests", () => {
    it("resolves an empty xref to the next available one", () => {
      fixture.componentRef.setInput("tabs", [{ type: "INDI", xref: "" }]);
      expect(component.effectiveTabs()).toEqual([
        { type: "INDI", xref: "@I1@" },
      ]);
    });
    it("keeps a provided xref as-is", () => {
      fixture.componentRef.setInput("tabs", [
        { type: "SOUR", xref: "@SOUR300@" },
      ]);
      expect(component.effectiveTabs()).toEqual([
        { type: "SOUR", xref: "@SOUR300@" },
      ]);
    });
  });

  describe("WorkingDatabase tests", () => {
    it.todo(
      "WorkingDatabase includes the contents of the ancestryService.AncestryDatabase()",
    );

    it("If a user provides an xref that does not exist, it will be created", () => {
      fixture.componentRef.setInput("tabs", [
        { type: "SOUR", xref: "@SOUR300@" },
      ]);
      expect(component.workingDatabase().sources["@SOUR300@"]).toEqual(
        newGedcomSource({
          xref: "@SOUR300@",
        }),
      );
    });
  });

  describe("WorkingDatabaseView tests", () => {
    it("WorkingDatabaseView will initially contain the xref provided by the user and nothing else", () => {
      fixture.componentRef.setInput("tabs", [
        { type: "SOUR", xref: "@SOUR300@" },
      ]);
      expect(component.workingDatabase()).toEqual(
        newGedcomDatabase({
          individuals: {
            "@I0@": newGedcomIndividual({
              xref: "@I0@",
              names: [
                newGedcomName({ givenName: "Stock", surname: "Individual" }),
              ],
              sex: newGedcomSex({ sex: "M" }),
              parentOfFamilyXrefs: ["@F0@"],
            }),
          },
          families: {
            "@F0@": newGedcomFamily({
              xref: "@F0@",
              husbandXref: "@I0@",
            }),
          },
          sources: {
            "@SOUR300@": newGedcomSource({
              xref: "@SOUR300@",
            }),
          },
        }),
      );
      expect(component.workingDatabaseView()).toEqual(
        newGedcomDatabase({
          sources: {
            "@SOUR300@": newGedcomSource({
              xref: "@SOUR300@",
            }),
          },
        }),
      );
    });

    it("Updates to xrefsIncludedInView will add stuff to workingDraftView", () => {
      fixture.componentRef.setInput("tabs", [
        { type: "SOUR", xref: "@SOUR300@" },
      ]);
      expect(component.workingDatabaseView()).toEqual(
        newGedcomDatabase({
          sources: {
            "@SOUR300@": newGedcomSource({
              xref: "@SOUR300@",
            }),
          },
        }),
      );
      component.xrefsIncludedInView.update(
        produce((draft) => {
          draft.push({ type: "FAM", xref: "@F0@" });
        }),
      );
      expect(component.workingDatabaseView()).toEqual(
        newGedcomDatabase({
          families: {
            "@F0@": newGedcomFamily({
              xref: "@F0@",
              husbandXref: "@I0@",
            }),
          },
          sources: {
            "@SOUR300@": newGedcomSource({
              xref: "@SOUR300@",
            }),
          },
        }),
      );
    });

    it("Updates to WorkingDatabaseView are propogated to WorkingDatabase", () => {
      component.workingDatabaseView.update(
        produce((draft) => {
          draft.individuals["@I1@"] = newGedcomIndividual({
            xref: "@I1@",
            names: [newGedcomName({ givenName: "John", surname: "Doe" })],
            facts: [
              newGedcomFact({
                id: 1,
                tag: "BIRT",
                date: newGedcomDate({ value: "1 JAN 1900" }),
                place: "Boston",
              }),
            ],
          });
        }),
      );

      expect(component.workingDatabase()).toEqual(
        newGedcomDatabase({
          families: {
            "@F0@": newGedcomFamily({
              xref: "@F0@",
              husbandXref: "@I0@",
            }),
          },
          individuals: {
            "@I0@": newGedcomIndividual({
              xref: "@I0@",
              names: [
                newGedcomName({ givenName: "Stock", surname: "Individual" }),
              ],
              sex: newGedcomSex({ sex: "M" }),
              parentOfFamilyXrefs: ["@F0@"],
            }),
            "@I1@": newGedcomIndividual({
              xref: "@I1@",
              names: [newGedcomName({ givenName: "John", surname: "Doe" })],
              facts: [
                newGedcomFact({
                  id: 1,
                  tag: "BIRT",
                  date: newGedcomDate({ value: "1 JAN 1900" }),
                  place: "Boston",
                }),
              ],
            }),
          },
        }),
      );

      // const user = userEvent.setup();
      // const editorComponent = fixture.nativeElement as HTMLElement;

      // // Click Submit (Commit)
      // const submitButton = editorComponent.querySelector('input[type="submit"]');
      // assert.isOk(submitButton);
      // await user.click(submitButton);
      // await fixture.whenStable();

      // // Verify updateGedcomDatabase was called
      // expect(mockAncestryService.updateGedcomDatabase).toHaveBeenCalled();
      // const updatedDatabase = mockAncestryService.updateGedcomDatabase.mock
      //   .calls[0][0] as GedcomDatabase;
      // expect(updatedDatabase).toBe(component.workingDatabase());
      // expect(updatedDatabase).toEqual(
      //   newGedcomDatabase({
      //     individuals: {
      //       "@I0@": newGedcomIndividual({
      //         xref: "@I0@",
      //         names: [
      //           newGedcomName({ givenName: "Stock", surname: "Individual" }),
      //         ],
      //         sex: newGedcomSex({ sex: "M" }),
      //         parentOfFamilyXrefs: ["@F0@"],
      //       }),
      //       "@I1@": newGedcomIndividual({
      //         xref: "@I1@",
      //         names: [newGedcomName({ givenName: "John", surname: "Doe" })],
      //         facts: [
      //           newGedcomFact({
      //             tag: "BIRT",
      //             date: newGedcomDate({ value: "1 JAN 1900" }),
      //             place: "Boston",
      //           }),
      //           newGedcomFact({
      //             tag: "DEAT",
      //             date: newGedcomDate({ value: "10 Dec 1980" }),
      //             place: "Philadelphia",
      //           }),
      //         ],
      //       }),
      //     },
      //     families: {
      //       "@F0@": newGedcomFamily({
      //         xref: "@F0@",
      //         husbandXref: "@I0@",
      //       }),
      //     },
      //   }),
      // );
    });
  });

  describe("deleteRecord tests", () => {
    it("does nothing when the user declines the confirmation", () => {
      vi.spyOn(globalThis, "confirm").mockReturnValue(false);

      component.deleteRecord({ type: "INDI", xref: "@I0@" });

      expect(component.workingDatabase().individuals["@I0@"]).toBeDefined();
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it("removes the record, closes its tab, and reports an unsaved change", () => {
      vi.spyOn(globalThis, "confirm").mockReturnValue(true);
      component.xrefsIncludedInView.set([{ type: "INDI", xref: "@I0@" }]);
      component.activeTab.set({ type: "INDI", xref: "@I0@" });

      component.deleteRecord({ type: "INDI", xref: "@I0@" });

      expect(component.workingDatabase().individuals["@I0@"]).toBeUndefined();
      expect(component.xrefsIncludedInView()).toEqual([]);
      expect(component.activeTab()).toBeUndefined();
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it("switches the active tab to another open tab when the deleted one was active", () => {
      vi.spyOn(globalThis, "confirm").mockReturnValue(true);
      component.xrefsIncludedInView.set([
        { type: "INDI", xref: "@I0@" },
        { type: "FAM", xref: "@F0@" },
      ]);
      component.activeTab.set({ type: "INDI", xref: "@I0@" });

      component.deleteRecord({ type: "INDI", xref: "@I0@" });

      expect(component.activeTab()).toEqual({ type: "FAM", xref: "@F0@" });
    });

    it("leaves the active tab alone when a different tab is deleted", () => {
      vi.spyOn(globalThis, "confirm").mockReturnValue(true);
      component.xrefsIncludedInView.set([
        { type: "INDI", xref: "@I0@" },
        { type: "FAM", xref: "@F0@" },
      ]);
      component.activeTab.set({ type: "FAM", xref: "@F0@" });

      component.deleteRecord({ type: "INDI", xref: "@I0@" });

      expect(component.activeTab()).toEqual({ type: "FAM", xref: "@F0@" });
    });
  });

  describe("submitForm tests", () => {
    it("emits finished before navigating, so the dialog is already closed by the time the reload re-checks the unsaved-changes guard", async () => {
      vi.spyOn(ancestryService, "updateGedcomDatabase").mockResolvedValue(
        undefined,
      );
      const order: string[] = [];
      component.finished.subscribe(() => order.push("finished"));
      vi.spyOn(TestBed.inject(Router), "navigate").mockImplementation(() => {
        order.push("navigate");
        return Promise.resolve(true);
      });

      await component.submitForm(new Event("submit"));

      expect(order).toEqual(["finished", "navigate"]);
    });

    // Regression test for the bug this guards against: the <form> has no
    // `action`, so without preventDefault() the browser falls back to a
    // real navigation to the current URL on submit. That race (a real
    // unload attempt while the async save is still in flight) is what
    // trips the browser's native "leave site" prompt on every save,
    // across every page that embeds this editor -- see
    // GedcomEditorDialogComponent.onBeforeUnload.
    it("prevents the native form submission", async () => {
      vi.spyOn(ancestryService, "updateGedcomDatabase").mockResolvedValue(
        undefined,
      );
      vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
      const event = new Event("submit", { cancelable: true });

      await component.submitForm(event);

      expect(event.defaultPrevented).toBe(true);
    });

    describe("with a multimedia file picked from outside the data folder", () => {
      const file = new File(["png"], "IMG_0042.PNG", { type: "image/png" });
      let xref: string;
      let filePath: string;

      beforeEach(() => {
        vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
        xref = component.openNewMultimedia();
        filePath = `${xref.replaceAll("@", "")} Census.png`;
        component.workingDatabase.update((database) =>
          produce(database, (draft) => {
            const multimedia = draft.multimedias[xref];
            assert(multimedia);
            // What the multimedia input proposes for this record and file.
            multimedia.title = "Census";
            multimedia.filePath = filePath;
          }),
        );
        component.setPendingMultimediaFile(xref, file);
      });

      it("lists the file to copy alongside the GEDCOM delta", async () => {
        await fixture.whenStable();

        expect(component.pendingMultimediaCopies()).toEqual([
          { file, filePath: filePath },
        ]);
        expect(
          screen.getByText("Files to copy into the data folder"),
        ).toBeTruthy();
        expect(screen.getByRole("cell", { name: "IMG_0042.PNG" })).toBeTruthy();
        expect(screen.getByRole("cell", { name: filePath })).toBeTruthy();
      });

      it("copies the file in before saving", async () => {
        const order: string[] = [];
        vi.spyOn(ancestryService, "multimediaFileExists").mockResolvedValue(
          false,
        );
        const copy = vi
          .spyOn(ancestryService, "copyMultimediaFile")
          .mockImplementation(() => {
            order.push("copy");
            return Promise.resolve();
          });
        vi.spyOn(ancestryService, "updateGedcomDatabase").mockImplementation(
          () => {
            order.push("save");
            return Promise.resolve();
          },
        );

        await component.submitForm(new Event("submit"));

        expect(copy).toHaveBeenCalledWith(file, filePath);
        expect(order).toEqual(["copy", "save"]);
        expect(component.pendingMultimediaFile(xref)).toBeUndefined();
      });

      it("doesn't copy or save if the file already exists", async () => {
        vi.spyOn(ancestryService, "multimediaFileExists").mockResolvedValue(
          true,
        );
        vi.spyOn(console, "error").mockReturnValue();
        const alert = vi.spyOn(window, "alert").mockReturnValue();
        const copy = vi.spyOn(ancestryService, "copyMultimediaFile");
        const save = vi.spyOn(ancestryService, "updateGedcomDatabase");

        await component.submitForm(new Event("submit"));

        expect(alert).toHaveBeenCalledWith(
          expect.stringContaining("already exists"),
        );
        expect(copy).not.toHaveBeenCalled();
        expect(save).not.toHaveBeenCalled();
      });

      it("reports a failed copy and doesn't save", async () => {
        vi.spyOn(ancestryService, "multimediaFileExists").mockResolvedValue(
          false,
        );
        vi.spyOn(ancestryService, "copyMultimediaFile").mockRejectedValue(
          new Error("disk full"),
        );
        vi.spyOn(console, "error").mockReturnValue();
        const alert = vi.spyOn(window, "alert").mockReturnValue();
        const save = vi.spyOn(ancestryService, "updateGedcomDatabase");

        await component.submitForm(new Event("submit"));

        expect(alert).toHaveBeenCalledWith("Couldn't save: disk full");
        expect(save).not.toHaveBeenCalled();
      });
    });
  });
});

// Regression test for a bug where opening the editor on an existing
// family and making no changes still reported unsaved changes. The root
// cause: GedcomFamily had no `unknownRecords` fallback (unlike
// GedcomIndividual/GedcomSource), so FAM child records the parser doesn't
// have a typed field for (e.g. NOTE, RIN) were silently dropped on
// serialize. That made the freshly opened, unedited family look
// different from the file on disk, which compareGedcomDatabase() (used
// here via the real implementation, not a canned mock) reports as a real
// difference. differences() still surfaces that comparison (it drives the
// Gedcom diff-review tab), so it's what this regression test checks now;
// hasUnsavedChanges() itself no longer depends on compareGedcomDatabase()
// at all -- see the dirty-form tests below.
//
// This is a separate top-level describe, with its own TestBed, rather
// than nested in the suite above: that suite's beforeEach already
// renders a GedcomEditorComponent and sets its inputs, and re-setting
// `ancestryDatabase` after the Signal Forms field tree has already been
// built against that initial database hits a known, unrelated
// test-environment fragility (see [[ancestry-immer-freeze-signal-forms]]).
describe("GedcomEditorComponent unlinked multimedia files", () => {
  let component: GedcomEditorComponent;

  beforeEach(async () => {
    const { fixture } = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });
    component = fixture.componentInstance;
    fixture.componentRef.setInput("tabs", [{ type: "OBJE", xref: "@O1@" }]);
    fixture.componentRef.setInput(
      "ancestryDatabase",
      newGedcomDatabase({
        multimedias: {
          "@O1@": newGedcomMultimedia({ xref: "@O1@", filePath: "old.png" }),
          "@O2@": newGedcomMultimedia({ xref: "@O2@", filePath: "shared.png" }),
        },
      }),
    );
  });

  function setFilePath(xref: string, filePath: string) {
    component.workingDatabase.update((database) =>
      produce(database, (draft) => {
        const multimedia = draft.multimedias[xref];
        assert(multimedia);
        multimedia.filePath = filePath;
      }),
    );
  }

  it("lists nothing when no file path changed", () => {
    expect(component.unlinkedMultimediaFiles()).toEqual([]);
  });

  it("lists a replaced file that nothing links to any more", () => {
    setFilePath("@O1@", "new.png");

    expect(component.unlinkedMultimediaFiles()).toEqual([
      { xref: "@O1@", oldPath: "old.png", stillLinkedFrom: [] },
    ]);
  });

  it("says which records still link to a replaced file", () => {
    setFilePath("@O1@", "shared.png");
    setFilePath("@O2@", "other.png");

    expect(component.unlinkedMultimediaFiles()).toEqual([
      { xref: "@O1@", oldPath: "old.png", stillLinkedFrom: [] },
      { xref: "@O2@", oldPath: "shared.png", stillLinkedFrom: ["O1"] },
    ]);
  });
});

describe("GedcomEditorComponent differences with a real, unedited family", () => {
  it("reports the open family's unchanged Gedcom, even when it has fields the parser doesn't have a typed field for", async () => {
    // compareGedcomDatabase() always regenerates a canonical HEAD record
    // (see generateGedcomHeader()), independent of this test's family
    // bug, so the original records need a matching header or that
    // unrelated, pre-existing behavior would show up as a difference too
    // and mask what this test is actually checking.
    const headerText = serializeGedcomRecordToText(
      serializeGedcomHeader(generateGedcomHeader()),
    );
    const originalGedcomRecords = parseGedcomRecords(
      [
        ...headerText,
        "0 @I0@ INDI",
        "1 FAMS @F0@",
        "0 @F0@ FAM",
        "1 HUSB @I0@",
        "1 NOTE Some family note",
        "1 RIN 123",
        "0 TRLR",
      ].join("\n"),
    );
    const originalDatabase = parseGedcomDatabase(originalGedcomRecords);

    const renderResult = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });
    renderResult.fixture.componentRef.setInput("tabs", [
      { type: "FAM", xref: "@F0@" },
    ]);
    renderResult.fixture.componentRef.setInput(
      "ancestryDatabase",
      originalDatabase,
    );

    vi.spyOn(
      TestBed.inject(AncestryService),
      "compareGedcomDatabase",
    ).mockImplementation((gedcomDatabase) =>
      compareGedcomDatabase(
        originalGedcomRecords,
        originalDatabase,
        gedcomDatabase,
      ),
    );

    // The open family's record is always included (the point of this
    // fix: the Gedcom tab stays visible even with nothing to show as
    // changed), but it must be reported as unchanged -- not as an
    // incidental difference caused by the unknownRecords bug this test
    // was originally written to catch.
    const differences = renderResult.fixture.componentInstance.differences();
    expect(differences).toHaveLength(1);
    const [difference] = differences;
    if (
      difference?.originalGedcomRecord == undefined ||
      difference.updatedGedcomRecord == undefined
    ) {
      throw new Error("expected both an original and an updated record");
    }
    expect(difference.updatedGedcomRecord).toEqual(
      difference.originalGedcomRecord,
    );
  });
});

// Regression test for the bug Bill reported directly: opening the family
// editor and making no changes still triggered the unsaved-changes
// warning on Escape. hasUnsavedChanges() is now based on the Signal Forms
// "dirty" state (this.form().dirty()) rather than diffing serialized
// GEDCOM text, since dirty tracks genuine user interaction and sidesteps
// unrelated differences (header restamping, fact/field reordering, etc.)
// that compareGedcomDatabase() can report even when nothing was edited.
// This is a separate top-level describe for the same TestBed-isolation
// reason as above.
describe("GedcomEditorComponent hasUnsavedChanges with real form interaction", () => {
  const database = newGedcomDatabase({
    individuals: {
      "@I0@": newGedcomIndividual({
        xref: "@I0@",
        names: [newGedcomName({ givenName: "Stock", surname: "Individual" })],
        sex: newGedcomSex({ sex: "M" }),
        parentOfFamilyXrefs: ["@F0@"],
      }),
      "@I1@": newGedcomIndividual({
        xref: "@I1@",
        names: [newGedcomName({ givenName: "Other", surname: "Individual" })],
        sex: newGedcomSex({ sex: "F" }),
      }),
    },
    families: {
      "@F0@": newGedcomFamily({
        xref: "@F0@",
        husbandXref: "@I0@",
      }),
    },
  });

  async function renderOnFamily() {
    const renderResult = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });
    renderResult.fixture.componentRef.setInput("tabs", [
      { type: "FAM", xref: "@F0@" },
    ]);
    renderResult.fixture.componentRef.setInput("ancestryDatabase", database);
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();
    return renderResult;
  }

  it("returns false when the family has just been opened and nothing was edited", async () => {
    const renderResult = await renderOnFamily();

    expect(renderResult.fixture.componentInstance.hasUnsavedChanges()).toBe(
      false,
    );
  });

  it("returns true after a real edit to a field in the family form", async () => {
    const renderResult = await renderOnFamily();

    const [, wifeSelect] = screen.getAllByRole<HTMLSelectElement>("combobox");
    assert.isOk(wifeSelect);
    const user = userEvent.setup();
    await user.selectOptions(wifeSelect, "@I1@");
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();

    expect(renderResult.fixture.componentInstance.hasUnsavedChanges()).toBe(
      true,
    );
  });
});

// serializeGedcomIndividual caches by object, which is only safe as long
// as editing an individual never mutates it in place.
describe("GedcomEditorComponent edits leave the original individual untouched", () => {
  it("makes a new individual object when a field is typed into", async () => {
    const individual = newGedcomIndividual({
      xref: "@I0@",
      names: [newGedcomName({ givenName: "Stock", surname: "Individual" })],
      sex: newGedcomSex({ sex: "M" }),
    });
    const database = newGedcomDatabase({
      individuals: { [individual.xref]: individual },
    });
    const before = serializeGedcomRecordToText(
      serializeGedcomIndividual(individual),
    );

    const renderResult = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });
    renderResult.fixture.componentRef.setInput("tabs", [
      { type: "INDI", xref: "@I0@" },
    ]);
    renderResult.fixture.componentRef.setInput("ancestryDatabase", database);
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();

    const givenName = screen
      .getAllByRole<HTMLInputElement>("textbox")
      .find((input) => input.value === "Stock");
    assert.isOk(givenName);
    const user = userEvent.setup();
    await user.type(givenName, "y");
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();

    const edited =
      renderResult.fixture.componentInstance.workingDatabase().individuals[
        "@I0@"
      ];
    assert.isOk(edited);
    expect(edited).not.toBe(individual);
    expect(individual.names[0]?.givenName).toBe("Stock");
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(individual)),
    ).toEqual(before);
    expect(
      serializeGedcomRecordToText(serializeGedcomIndividual(edited)).join("\n"),
    ).toContain("Stocky");
  });
});

describe("GedcomEditorComponent opening an existing record", () => {
  it("opens an existing source from the Add to Session menu", async () => {
    const source = newGedcomSource({ xref: "@S1@", abbr: "1880 Census" });
    const database = newGedcomDatabase({ sources: { "@S1@": source } });
    const renderResult = await render(GedcomEditorComponent, {
      providers: [provideRouter([])],
      skipDetectChanges: true,
    });
    renderResult.fixture.componentRef.setInput("tabs", [
      { type: "OBJE", xref: "" },
    ]);
    renderResult.fixture.componentRef.setInput("ancestryDatabase", database);
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();

    const user = userEvent.setup();
    await user.click(screen.getByText("Add to Session"));
    await user.type(
      screen.getByRole("searchbox", { name: "Search existing records" }),
      "1880",
    );
    await user.click(screen.getByRole("button", { name: /1880 Census/ }));
    renderResult.fixture.detectChanges();
    await renderResult.fixture.whenStable();

    const component = renderResult.fixture.componentInstance;
    expect(component.xrefsIncludedInView()).toEqual([
      { type: "OBJE", xref: "@M0@" },
      { type: "SOUR", xref: "@S1@" },
    ]);
    expect(component.activeTab()).toEqual({ type: "SOUR", xref: "@S1@" });
    // Opening it doesn't change the record.
    expect(component.workingDatabase().sources["@S1@"]).toBe(source);
  });
});
