import { AncestryService } from "../../database/ancestry.service";
import type { AncestryDatabase } from "../../database/ancestry.service";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import {
  GedcomEditorComponent,
  calculateNextIndividualXref,
  calculateNextMultimediaXref,
  calculateNextSourceXref,
} from "./gedcom-editor.component";
import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

describe("GedcomEditorComponent helpers", () => {
  describe("calculateNextIndividualXref", () => {
    it("should return @I0@ for an empty database", () => {
      expect(calculateNextIndividualXref({})).toBe("@I0@");
    });

    it("should return the next available index", () => {
      const individuals = {
        "@I1@": { xref: "@I1@" },
        "@I5@": { xref: "@I5@" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextIndividualXref(individuals)).toBe("@I6@");
    });

    it("should handle non-conforming xrefs by ignoring them", () => {
      const individuals = {
        "@I1@": { xref: "@I1@" },
        OTHER: { xref: "OTHER" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextIndividualXref(individuals)).toBe("@I2@");
    });
  });

  describe("calculateNextSourceXref", () => {
    it("should return @S0@ for an empty database", () => {
      expect(calculateNextSourceXref({})).toBe("@S0@");
    });

    it("should return the next available index", () => {
      const sources = {
        "@S1@": { xref: "@S1@" },
        "@S10@": { xref: "@S10@" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextSourceXref(sources)).toBe("@S11@");
    });
  });

  describe("calculateNextMultimediaXref", () => {
    it("should return @M0@ for an empty database", () => {
      expect(calculateNextMultimediaXref({})).toBe("@M0@");
    });

    it("should return the next available index", () => {
      const multimedias = {
        "@M1@": { xref: "@M1@" },
        "@M3@": { xref: "@M3@" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextMultimediaXref(multimedias)).toBe("@M4@");
    });

    it("should handle non-conforming xrefs by ignoring them", () => {
      const multimedias = {
        "@M1@": { xref: "@M1@" },
        OTHER: { xref: "OTHER" },
      };
      // @ts-expect-error - Partial mock
      expect(calculateNextMultimediaXref(multimedias)).toBe("@M2@");
    });
  });
});

describe("GedcomEditorComponent Integration", () => {
  let fixture: ComponentFixture<GedcomEditorComponent>;
  let mockAncestryService: {
    ancestryDatabase: any;
    updateGedcomDatabase: any;
    compareGedcomDatabase: any;
    gedcomResource: any;
  };

  const initialDatabase: AncestryDatabase = {
    individuals: {
      "@I0@": {
        xref: "@I0@",
        names: [
          {
            givenName: "Stock",
            surname: "Individual",
            prefix: "",
            nickName: "",
            surnamePrefix: "",
            suffix: "",
            nameType: "",
            citations: [],
            notes: [],
          },
        ],
        events: [],
        sex: { sex: "M", citations: [] },
        childOfFamilyXrefs: [],
        parentOfFamilyXrefs: ["@F0@"],
        notes: [],
        unknownRecords: [],
      },
    },
    families: {
      "@F0@": {
        xref: "@F0@",
        husbandXref: "@I0@",
        wifeXref: "",
        childXrefs: [],
        events: [],
        citations: [],
      },
    },
    sources: {},
    multimedias: {},
    submitters: {},
    repositories: {},
  };

  async function openDetails(details: HTMLDetailsElement) {
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    // Polyfill HTMLDialogElement for JSDOM
    const dialogProto = window.HTMLDialogElement.prototype;
    dialogProto.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
      this.dispatchEvent(new Event("toggle"));
    });
    dialogProto.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("toggle"));
    });

    mockAncestryService = {
      ancestryDatabase: signal(initialDatabase),
      updateGedcomDatabase: vi.fn().mockResolvedValue(undefined),
      compareGedcomDatabase: vi.fn().mockReturnValue([]),
      gedcomResource: {
        value: signal({ gedcomRecords: [] }),
        isLoading: signal(false),
      },
    };

    await TestBed.configureTestingModule({
      imports: [GedcomEditorComponent],
      providers: [
        { provide: AncestryService, useValue: mockAncestryService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GedcomEditorComponent);
    fixture.componentRef.setInput("type", "INDI");
    fixture.detectChanges();
  });

  it("should create a new individual John Doe with birth and death events", async () => {
    const editorComponent = fixture.nativeElement as HTMLElement;

    const namesContainer = editorComponent.querySelector<HTMLDetailsElement>(
      "app-input-individual-names > details",
    );
    assert.isOk(namesContainer);
    await openDetails(namesContainer);

    const addNameButton = namesContainer.querySelector<HTMLElement>(
      'button[aria-label="Add name"]',
    );
    assert.isOk(addNameButton);
    addNameButton.click();
    await fixture.whenStable();

    const givenNameInput = namesContainer.querySelector<HTMLInputElement>(
      'input[id^="given_0"]',
    );
    assert.isOk(givenNameInput);
    givenNameInput.value = "John";
    givenNameInput.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    const surnameInput = namesContainer.querySelector<HTMLInputElement>(
      'input[id^="surname_0"]',
    );
    assert.isOk(surnameInput);
    surnameInput.value = "Doe";
    surnameInput.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    const eventsContainer = editorComponent.querySelector<HTMLDetailsElement>(
      "app-input-individual-events > details",
    );
    assert.isOk(eventsContainer);
    await openDetails(eventsContainer);

    const addEventButton = eventsContainer.querySelector<HTMLButtonElement>(
      'button[aria-label="Add event"]',
    );
    assert.isOk(addEventButton);
    addEventButton.click();
    await fixture.whenStable();

    const birthDetails = eventsContainer.querySelector<HTMLDetailsElement>(
      ":scope > details:last-of-type",
    );
    assert.isOk(birthDetails);
    await openDetails(birthDetails);

    const birthTag =
      birthDetails.querySelector<HTMLSelectElement>('select[id^="tag_"]');
    assert.isOk(birthTag);
    birthTag.value = "BIRT";
    birthTag.dispatchEvent(new Event("change", { bubbles: true }));
    birthTag.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    const birthDate =
      birthDetails.querySelector<HTMLInputElement>('input[id^="date_"]');
    assert.isOk(birthDate);
    birthDate.value = "1 Jan 1900";
    birthDate.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    const birthPlace = birthDetails.querySelector<HTMLInputElement>(
      'input[id^="place_"]',
    );
    assert.isOk(birthPlace);
    birthPlace.value = "Boston";
    birthPlace.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    addEventButton.click();
    await fixture.whenStable();

    const deathDetails = eventsContainer.querySelector<HTMLDetailsElement>(
      ":scope > details:last-of-type",
    );
    assert.isOk(deathDetails);
    await openDetails(deathDetails);

    const deathTag =
      deathDetails.querySelector<HTMLSelectElement>('select[id^="tag_"]');
    assert.isOk(deathTag);
    deathTag.value = "DEAT";
    deathTag.dispatchEvent(new Event("change", { bubbles: true }));
    deathTag.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    const deathDate =
      deathDetails.querySelector<HTMLInputElement>('input[id^="date_"]');
    assert.isOk(deathDate);
    deathDate.value = "10 Dec 1980";
    deathDate.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    const deathPlace = deathDetails.querySelector<HTMLInputElement>(
      'input[id^="place_"]',
    );
    assert.isOk(deathPlace);
    deathPlace.value = "Philadelphia";
    deathPlace.dispatchEvent(new Event("input", { bubbles: true }));
    await fixture.whenStable();

    // Click Submit (Commit)
    const submitButton = editorComponent.querySelector<HTMLInputElement>(
      'input[type="submit"]',
    );
    assert.isOk(submitButton);
    submitButton.click();
    await fixture.whenStable();

    // Verify updateGedcomDatabase was called
    expect(mockAncestryService.updateGedcomDatabase).toHaveBeenCalled();
    const updatedDatabase = mockAncestryService.updateGedcomDatabase.mock
      .calls[0][0] as AncestryDatabase;

    // Check that John Doe exists
    const individuals = Object.values(updatedDatabase.individuals);
    const johnDoe = individuals.find((i: GedcomIndividual) =>
      i.names.some((n) => n.givenName === "John" && n.surname === "Doe"),
    );
    assert.isOk(johnDoe);
    expect(johnDoe.events).toContainEqual(
      expect.objectContaining({
        tag: "BIRT",
        date: { value: "1 Jan 1900" },
        place: "Boston",
      }),
    );
    expect(johnDoe.events).toContainEqual(
      expect.objectContaining({
        tag: "DEAT",
        date: { value: "10 Dec 1980" },
        place: "Philadelphia",
      }),
    );

    // Check that stock data is maintained
    assert.isOk(updatedDatabase.individuals["@I0@"]);
    assert.isOk(updatedDatabase.families["@F0@"]);

    vi.unstubAllGlobals();
  });
});
