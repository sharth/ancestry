import { inputBinding, signal, type WritableSignal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it } from "vitest";
import { AncestryService } from "../../database/ancestry.service";
import { newGedcomDate } from "../../gedcom/gedcomDate";
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import {
  EventsTimelineComponent,
  type TimelineEvent,
} from "./events-timeline.component";

const fakeAncestryService = {
  ancestryDatabase: () => ({
    sources: {
      "@S1@": { abbr: "1910 Census", title: "1910 United States Federal Census" },
      "@S2@": { abbr: "", title: "Massachusetts, Death Index, 1901-1980" },
    },
  }),
};

describe("EventsTimelineComponent", () => {
  let events: WritableSignal<TimelineEvent[]>;
  let fixture: ComponentFixture<EventsTimelineComponent>;
  let component: EventsTimelineComponent;
  let element: HTMLElement;

  beforeEach(async () => {
    events = signal<TimelineEvent[]>([
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
            newGedcomSourceCitation({
              sourceXref: "@S1@",
              page: "p. 12",
              text: "Age 45, born Massachusetts",
            }),
            newGedcomSourceCitation({ sourceXref: "@S2@" }),
            newGedcomSourceCitation({ sourceXref: "@S3@" }),
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
    ]);

    const renderResult = await render(EventsTimelineComponent, {
      providers: [
        { provide: AncestryService, useValue: fakeAncestryService },
        provideRouter([]),
      ],
      bindings: [inputBinding("events", events)],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
  });

  it("orders events by sort date, then date, with undated events last", () => {
    expect(component.rows().map((row) => row.title)).toEqual([
      "Marriage",
      "Residence",
      "Occupation",
    ]);
  });

  it("shows the year from the date, never the sort date", () => {
    expect(component.rows().map((row) => row.year)).toEqual(["", "1910", ""]);
  });

  it("shows event details", () => {
    const text = element.textContent.replace(/\s+/g, " ");
    expect(text).toContain("Abt. 1910 • Boston, Suffolk, Massachusetts, USA");
    expect(text).toContain("3 sources");
    expect(text).toContain("Carpenter");
    // The source's abbreviation is preferred, then its title, then its xref.
    expect(text).toContain("1910 Census — p. 12");
    expect(text).toContain("Age 45, born Massachusetts");
    expect(text).toContain("Massachusetts, Death Index, 1901-1980");
    expect(text).toContain("@S3@");
    expect(
      element.querySelector('a[href="/family/@F1@"]')?.textContent,
    ).toContain("Family");
  });

  it("links each family event to its own family and spouse", async () => {
    // Someone married twice has events from two families.
    events.set([
      {
        owner: "family",
        familyXref: "@F2@",
        spouseXref: "@I3@",
        fact: newGedcomFact({
          tag: "MARR",
          date: newGedcomDate({ value: "1930" }),
        }),
      },
      {
        owner: "family",
        familyXref: "@F1@",
        spouseXref: "@I2@",
        fact: newGedcomFact({
          tag: "MARR",
          date: newGedcomDate({ value: "1912" }),
        }),
      },
      {
        owner: "family",
        familyXref: "@F1@",
        spouseXref: "@I2@",
        fact: newGedcomFact({
          tag: "DIV",
          date: newGedcomDate({ value: "1925" }),
        }),
      },
    ]);
    await fixture.whenStable();

    expect(
      component
        .rows()
        .map(({ title, event }) => [title, event.familyXref, event.spouseXref]),
    ).toEqual([
      ["Marriage", "@F1@", "@I2@"],
      ["Divorce", "@F1@", "@I2@"],
      ["Marriage", "@F2@", "@I3@"],
    ]);

    const familyLinks = Array.from(
      element.querySelectorAll(".timeline-family-link"),
      (link) => link.getAttribute("href"),
    );
    expect(familyLinks).toEqual([
      "/family/@F1@",
      "/family/@F1@",
      "/family/@F2@",
    ]);
  });
});
