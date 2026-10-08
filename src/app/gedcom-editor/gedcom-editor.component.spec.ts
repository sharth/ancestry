import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { produce } from "immer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomDate } from "../../gedcom/gedcomDate";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomName } from "../../gedcom/gedcomName";
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

  describe("hasUnsavedChanges tests", () => {
    // AncestryService.compareGedcomDatabase() diffs against whatever GEDCOM
    // file is currently loaded (nothing, in this test environment), so it's
    // stubbed directly to control what differences() reports.
    it("returns false when compareGedcomDatabase reports no differences", () => {
      vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([]);
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it("returns true when compareGedcomDatabase reports a difference", () => {
      vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([
        { originalGedcomRecord: undefined, updatedGedcomRecord: undefined },
      ]);
      expect(component.hasUnsavedChanges()).toBe(true);
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

      await component.submitForm();

      expect(order).toEqual(["finished", "navigate"]);
    });
  });
});
