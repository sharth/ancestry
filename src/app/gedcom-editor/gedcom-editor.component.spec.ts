import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { userEvent } from "@testing-library/user-event";
import { produce } from "immer";
import { beforeEach, describe, expect, it } from "vitest";
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

  async function openDetails(details: HTMLDetailsElement) {
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    await fixture.whenStable();
  }

  function activePanel(editorComponent: HTMLElement): HTMLElement {
    const panel = editorComponent.querySelector<HTMLElement>(
      "div:not([hidden]) > app-gedcom-editor-individual, " +
        "div:not([hidden]) > app-gedcom-editor-source, " +
        "div:not([hidden]) > app-gedcom-editor-multimedia, " +
        "div:not([hidden]) > app-gedcom-editor-repository",
    )?.parentElement;
    return panel ?? editorComponent;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GedcomEditorComponent);
    component = fixture.componentInstance;
    ancestryService = TestBed.inject(AncestryService);

    fixture.componentRef.setInput("type", "INDI");
    fixture.componentRef.setInput("ancestryDatabase", initialDatabase);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("effectiveXref tests", () => {
    it("effectiveXref contains the nextXref if none provided", () => {
      fixture.componentRef.setInput("type", "INDI");
      fixture.componentRef.setInput("xref", undefined);
      expect(component.effectiveXref()).toEqual("@I1@");
    });
    it("effectiveXref contains xref if provided", () => {
      fixture.componentRef.setInput("type", "SOUR");
      fixture.componentRef.setInput("xref", "@SOUR300@");
      expect(component.effectiveXref()).toEqual("@SOUR300@");
    });
  });

  describe("WorkingDatabase tests", () => {
    it("WorkingDatabase includes the contents of the ancestryService.AncestryDatabase()", () => {
      // TODO
    });

    it("If a user provides an xref that does not exist, it will be created", () => {
      fixture.componentRef.setInput("type", "SOUR");
      fixture.componentRef.setInput("xref", "@SOUR300@");
      expect(component.workingDatabase().sources["@SOUR300@"]).toEqual(
        newGedcomSource({
          xref: "@SOUR300@",
        }),
      );
    });
  });

  describe("WorkingDatabaseView tests", () => {
    it("WorkingDatabaseView will initially contain the xref provided by the user and nothing else", () => {
      fixture.componentRef.setInput("type", "SOUR");
      fixture.componentRef.setInput("xref", "@SOUR300@");
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
      fixture.componentRef.setInput("type", "SOUR");
      fixture.componentRef.setInput("xref", "@SOUR300@");
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

  // it("should edit a source, create a linked repository, and attach source to an individual fact", async () => {
  //   const user = userEvent.setup();
  //   fixture = TestBed.createComponent(GedcomEditorComponent);
  //   fixture.componentRef.setInput("type", "SOUR");
  //   fixture.componentRef.setInput("ancestryDatabase", initialDatabase);
  //   fixture.detectChanges();
  //   await fixture.whenStable();

  //   const editorComponent = fixture.nativeElement as HTMLElement;

  //   // 1. Fill in Source Title
  //   const titleTextarea =
  //     editorComponent.querySelector<HTMLTextAreaElement>("textarea#title");
  //   assert.isOk(titleTextarea);
  //   await user.type(titleTextarea, "1900 US Census");
  //   await fixture.whenStable();

  //   // 2. Open Repositories details and click "Associate with another repository"
  //   fixture.detectChanges();
  //   const repoDetails = activePanel(
  //     editorComponent,
  //   ).querySelector<HTMLDetailsElement>("app-input-repository-links > details");
  //   assert.isOk(repoDetails);
  //   await openDetails(repoDetails);

  //   const addRepoBtn =
  //     repoDetails.querySelector<HTMLDivElement>(".details-lookalike");
  //   assert.isOk(addRepoBtn);
  //   await user.click(addRepoBtn);
  //   await fixture.whenStable();

  //   // Find the new repository item and click [+ New]
  //   const newRepoBtn = repoDetails.querySelector<HTMLButtonElement>(
  //     'button[title="Create a new repository and open in tab"]',
  //   );
  //   assert.isOk(newRepoBtn);
  //   await user.click(newRepoBtn);
  //   await fixture.whenStable();

  //   // Now repository tab is active! Verify active record is REPO
  //   expect(fixture.componentInstance.activeTab()).toEqual({
  //     tag: "REPO",
  //     xref: "@R0@",
  //   });
  //   fixture.detectChanges();
  //   const repoNameInput =
  //     activePanel(editorComponent).querySelector<HTMLInputElement>(
  //       "input#name",
  //     );
  //   assert.isOk(repoNameInput);
  //   await user.type(repoNameInput, "National Archives");
  //   await fixture.whenStable();

  //   // 3. Switch back to Source tab
  //   const sourceTabBtn = editorComponent.querySelectorAll<HTMLButtonElement>(
  //     ".working-set-tabs button",
  //   )[0];
  //   assert.isOk(sourceTabBtn);
  //   await user.click(sourceTabBtn);
  //   await fixture.whenStable();
  //   expect(fixture.componentInstance.activeTab()).toEqual({
  //     type: "SOUR",
  //     xref: "@S0@",
  //   });

  //   // 4. Attach citation to stock individual (@I0@)
  //   fixture.detectChanges();
  //   const citationsDetails = activePanel(
  //     editorComponent,
  //   ).querySelector<HTMLDetailsElement>(
  //     "app-input-source-fact-citations > details",
  //   );
  //   assert.isOk(citationsDetails);
  //   await openDetails(citationsDetails);

  //   const indiSelect =
  //     citationsDetails.querySelector<HTMLSelectElement>("select#attach-indi");
  //   assert.isOk(indiSelect);
  //   await user.selectOptions(indiSelect, "@I0@");
  //   await fixture.whenStable();

  //   // Choose + New Fact
  //   const newFactRadio =
  //     citationsDetails.querySelector<HTMLInputElement>("input#modeNew");
  //   assert.isOk(newFactRadio);
  //   await user.click(newFactRadio);
  //   await fixture.whenStable();

  //   const dateInput = citationsDetails.querySelector<HTMLInputElement>(
  //     "input#new-fact-date",
  //   );
  //   assert.isOk(dateInput);
  //   await user.type(dateInput, "1900");
  //   await fixture.whenStable();

  //   const attachBtn = citationsDetails.querySelector<HTMLButtonElement>(
  //     "button:has(.bi-check-lg)",
  //   );
  //   assert.isOk(attachBtn);
  //   await user.click(attachBtn);
  //   await fixture.whenStable();

  //   // 5. Submit
  //   const submitBtn = editorComponent.querySelector<HTMLInputElement>(
  //     'input[type="submit"]',
  //   );
  //   assert.isOk(submitBtn);
  //   await user.click(submitBtn);
  //   await fixture.whenStable();

  //   // Verify all records were saved together in updateGedcomDatabase
  //   expect(mockAncestryService.updateGedcomDatabase).toHaveBeenCalled();
  //   const updatedDb = mockAncestryService.updateGedcomDatabase.mock
  //     .calls[0][0] as GedcomDatabase;

  //   // Check Source
  //   const source = Object.values(updatedDb.sources)[0];
  //   assert.isOk(source);
  //   expect(source.title).toBe("1900 US Census");
  //   expect(source.repositoryLinks.length).toBe(1);

  //   // Check Repository
  //   const firstRepoLink = source.repositoryLinks[0];
  //   assert.isOk(firstRepoLink);
  //   const repoXref = firstRepoLink.repositoryXref;
  //   const repo = updatedDb.repositories[repoXref];
  //   assert.isOk(repo);
  //   expect(repo.name).toBe("National Archives");

  //   // Check Individual fact citation
  //   const indi = updatedDb.individuals["@I0@"];
  //   assert.isOk(indi);
  //   const censFact = indi.facts.find((f) => f.tag === "CENS");
  //   assert.isOk(censFact);
  //   expect(censFact.date.value).toBe("1900");
  //   const firstCit = censFact.citations[0];
  //   assert.isOk(firstCit);
  //   expect(firstCit.sourceXref).toBe(source.xref);
  // });

  // it("should allow closing non-root tabs and prevent closing the root tab", async () => {
  //   fixture = TestBed.createComponent(GedcomEditorComponent);
  //   fixture.componentRef.setInput("type", "SOUR");
  //   fixture.componentRef.setInput("ancestryDatabase", initialDatabase);
  //   fixture.detectChanges();
  //   await fixture.whenStable();

  //   const session = fixture.componentInstance;
  //   expect(session.xrefsIncludedInView().length).toBe(1);
  //   const rootTab = session.xrefsIncludedInView()[0];
  //   assert.isOk(rootTab);
  //   expect(session.activeTab()).toEqual(rootTab);

  //   // Add repository
  //   const repoXref = session.openNewRepository();
  //   expect(session.xrefsIncludedInView().length).toBe(2);
  //   expect(session.activeTab()).toEqual({ type: "REPO", xref: repoXref });
  // });
});
