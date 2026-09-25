import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { beforeEach, describe, expect, it } from "vitest";
import { newGedcomDate } from "../../gedcom/gedcomDate";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import {
  EventsTimelineComponent,
  type TimelineEvent,
} from "./events-timeline.component";

describe("EventsTimelineComponent", () => {
  let fixture: ComponentFixture<EventsTimelineComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsTimelineComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const events: TimelineEvent[] = [
      {
        owner: "individual",
        fact: newGedcomFact({ tag: "OCCU", value: "Carpenter" }),
      },
      {
        owner: "individual",
        fact: newGedcomFact({
          tag: "RESI",
          date: newGedcomDate({ value: "ABT 1910" }),
          place: "Boston, Suffolk, Massachusetts, USA",
          citations: [
            newGedcomSourceCitation({ sourceXref: "@S1@" }),
            newGedcomSourceCitation({ sourceXref: "@S2@" }),
          ],
        }),
      },
      {
        owner: "family",
        familyXref: "@F1@",
        fact: newGedcomFact({
          tag: "MARR",
          date: newGedcomDate({ value: "(unknown)" }),
          sortDate: newGedcomDate({ value: "1905" }),
        }),
      },
    ];

    fixture = TestBed.createComponent(EventsTimelineComponent);
    fixture.componentRef.setInput("events", events);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  it("orders events by sort date, then date, with undated events last", () => {
    const titles = Array.from(
      element.querySelectorAll(".timeline-title"),
      (title) => title.textContent.trim(),
    );
    expect(titles).toEqual(["Marriage", "Residence", "Occupation"]);
  });

  it("shows the year from the date, never the sort date", () => {
    const years = Array.from(
      element.querySelectorAll(".timeline-year"),
      (year) => year.textContent.trim(),
    );
    expect(years).toEqual(["", "1910", ""]);
  });

  it("shows event details", () => {
    const text = element.textContent.replace(/\s+/g, " ");
    expect(text).toContain("Abt. 1910 • Boston, Suffolk, Massachusetts, USA");
    expect(text).toContain("2 sources");
    expect(text).toContain("Carpenter");
    expect(
      element.querySelector('a[href="/family/@F1@"]')?.textContent,
    ).toContain("Family");
  });
});
