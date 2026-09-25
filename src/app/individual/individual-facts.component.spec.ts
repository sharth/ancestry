import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
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

    const mockDatabase = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          facts: [
            newGedcomFact({
              tag: "DEAT",
              date: newGedcomDate({ value: "1970" }),
            }),
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
          wifeXref: "@I2@",
          facts: [
            newGedcomFact({
              tag: "MARR",
              date: newGedcomDate({ value: "12 JUN 1925" }),
            }),
          ],
        }),
      },
    });

    fixture.componentRef.setInput("ancestryDatabase", mockDatabase);
    fixture.componentRef.setInput("xref", "@I1@");
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render events and relatives sections", () => {
    const element = fixture.nativeElement as HTMLElement;
    const headings = Array.from(element.querySelectorAll("h2")).map(
      (h) => h.textContent,
    );
    expect(headings).toEqual(["Events", "Relatives"]);
  });

  it("should merge individual and family events chronologically", () => {
    const element = fixture.nativeElement as HTMLElement;
    const titles = Array.from(
      element.querySelectorAll(".timeline-title"),
      (title) => title.textContent.trim(),
    );
    const labels = Array.from(
      element.querySelectorAll(".timeline-when"),
      (when) =>
        Array.from(when.children, (child) => child.textContent.trim()).join(
          " ",
        ),
    );
    expect(titles).toEqual(["Birth", "Marriage", "Death"]);
    expect(labels).toEqual(["1900 (Age)", "1925 25", "1970 70"]);
  });
});
