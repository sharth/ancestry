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
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
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

  describe("family events on the individual's tab", () => {
    it("lists the spouse family's events with the individual's own, without a session tab for the family", async () => {
      fixture.componentRef.setInput("tabs", [{ type: "INDI", xref: "@I0@" }]);
      component.workingDatabase.update(
        produce((draft) => {
          draft.families["@F0@"]?.facts.push(newGedcomFact({ tag: "MARR" }));
        }),
      );
      fixture.detectChanges();
      await fixture.whenStable();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector("app-input-family-fact")).not.toBeNull();
      expect(screen.queryByRole("button", { name: /Family @F0@/ })).toBeNull();
    });
  });

  describe("impliedFamilyXrefs tests", () => {
    it("brings a spouse family into the form without adding it as a session tab", () => {
      fixture.componentRef.setInput("tabs", [{ type: "INDI", xref: "@I0@" }]);
      expect(component.impliedFamilyXrefs()).toEqual(["@F0@"]);
      expect(component.workingDatabaseView().families["@F0@"]).toEqual(
        newGedcomFamily({ xref: "@F0@", husbandXref: "@I0@" }),
      );
      expect(
        component
          .xrefsIncludedInView()
          .some((tab) => tab.type === "FAM" && tab.xref === "@F0@"),
      ).toBe(false);
    });
  });

  describe("spouse family fact tests", () => {
    const marriage = newGedcomFact({ tag: "MARR", place: "Boston" });

    beforeEach(() => {
      fixture.componentRef.setInput("tabs", [{ type: "INDI", xref: "@I0@" }]);
      component.workingDatabase.update(
        produce((draft) => {
          draft.individuals["@I1@"] = newGedcomIndividual({
            xref: "@I1@",
            sex: newGedcomSex({ sex: "F" }),
          });
          draft.individuals["@I2@"] = newGedcomIndividual({ xref: "@I2@" });
        }),
      );
    });

    it("does nothing when no spouse is chosen", () => {
      const before = component.workingDatabase();
      component.addFactToSpouseFamily("@I0@", "", marriage);
      expect(component.workingDatabase()).toBe(before);
    });

    it("adds the fact to the family the two already share", () => {
      component.workingDatabase.update(
        produce((draft) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          draft.families["@F0@"]!.wifeXref = "@I1@";
          draft.individuals["@I1@"]?.parentOfFamilyXrefs.push("@F0@");
        }),
      );

      component.addFactToSpouseFamily("@I0@", "@I1@", marriage);

      const database = component.workingDatabase();
      expect(Object.keys(database.families)).toEqual(["@F0@"]);
      expect(database.families["@F0@"]?.facts).toEqual([marriage]);
    });

    it("creates a family and links both spouses when they don't share one", () => {
      component.addFactToSpouseFamily("@I0@", "@I1@", marriage);

      const database = component.workingDatabase();
      const family = database.families["@F1@"];
      expect(family?.husbandXref).toBe("@I0@");
      expect(family?.wifeXref).toBe("@I1@");
      expect(family?.facts).toEqual([marriage]);
      expect(database.individuals["@I0@"]?.parentOfFamilyXrefs).toContain(
        "@F1@",
      );
      expect(database.individuals["@I1@"]?.parentOfFamilyXrefs).toContain(
        "@F1@",
      );
    });

    it("moves a family's fact to the family shared with a different spouse", () => {
      component.addFactToSpouseFamily("@I0@", "@I1@", marriage);
      component.moveFamilyFact("@I0@", "@F1@", 0, "@I2@");

      const database = component.workingDatabase();
      expect(database.families["@F1@"]?.facts).toEqual([]);
      expect(database.families["@F2@"]?.facts).toEqual([marriage]);
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
      compareGedcomDatabase(originalGedcomRecords, gedcomDatabase),
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
    expect(
      serializeGedcomRecordToText(difference.originalGedcomRecord),
    ).toEqual(serializeGedcomRecordToText(difference.updatedGedcomRecord));
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
