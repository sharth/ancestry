import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { newGedcomDate } from "../../gedcom/gedcomDate";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomFamily } from "../../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { IndividualFactsComponent } from "./individual-facts.component";

describe("IndividualFactsComponent", () => {
  let component: IndividualFactsComponent;
  let fixture: ComponentFixture<IndividualFactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndividualFactsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(IndividualFactsComponent);
    component = fixture.componentInstance;

    const mockDatabase: AncestryDatabase = {
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          facts: [
            newGedcomFact({
              tag: "BIRT",
              date: newGedcomDate({ value: "1 JAN 1900" }),
              place: "Some Place",
              sortDate: newGedcomDate({ value: "1900" }),
            }),
          ],
          parentOfFamilyXrefs: ["@F1@"],
        }),
      },
      families: {
        "@F1@": newGedcomFamily({
          xref: "@F1@",
          husbandXref: "@I1@",
        }),
      },
      sources: {},
      repositories: {},
      multimedias: {},
      submitters: {},
    };

    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);
    fixture.componentRef.setInput("xref", "@I1@");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render events and relatives sections", () => {
    const element = fixture.nativeElement as HTMLElement;
    const headings = Array.from(element.querySelectorAll("h2")).map(
      (h) => h.textContent,
    );
    expect(headings).toContain("Events");
    expect(headings).toContain("Events for Family @F1@");
    expect(headings).toContain("Relatives");
  });
});
