import { inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import type {
  MergeRepositoryLinksSuggestion,
  UrlRepositorySuggestion,
} from "./source-validators";
import { ValidationComponent } from "./validation.component";

describe("ValidationComponent", () => {
  let component: ValidationComponent;
  let fixture: ComponentFixture<ValidationComponent>;
  let ancestryService: AncestryService;

  const source = newGedcomSource({
    xref: "S1",
    text: "Found at https://example.com/record",
  });
  const urlSuggestion: UrlRepositorySuggestion = {
    fieldName: "text",
    url: "https://example.com/record",
    standalone: false,
    suggestedName: "example",
    matchedRepository: undefined,
  };

  beforeEach(async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        sources: { [source.xref]: source },
      }),
    );

    const renderResult = await render(ValidationComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
      waitForStableOnRender: true,
    });
    fixture = renderResult.fixture;
    component = fixture.componentInstance;
    ancestryService = TestBed.inject(AncestryService);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("hasUnsavedChanges delegates to the edit dialog", () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it("lists a warning with a button to review the suggested fix", async () => {
    expect(await screen.findByText(/Create repository/)).toBeTruthy();
  });

  it("shows the before and proposed-after GEDCOM for the suggestion", async () => {
    await screen.findByText(/Create repository/);
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain("1 TEXT Found at https://example.com/record");
    expect(text).toContain("1 REPO @R0@");
    expect(text).toContain("0 @R0@ REPO");
  });

  it("also offers a button to submit the suggested fix directly", async () => {
    expect(await screen.findByText(/Submit changes as proposed/)).toBeTruthy();
  });

  // Regression test: the proposed-after preview used to be built straight
  // from applyUrlSuggestion's output, which never touches changeDate, so the
  // CHAN bump that actually lands on save was invisible in this diff.
  it("shows the change date bump in the proposed-after preview", async () => {
    await screen.findByText(/Create repository/);
    const differences = component.differencesForUrlSuggestion(
      source,
      urlSuggestion,
    );
    const sourceDifference = differences.find(
      (d) => d.updatedGedcomRecord?.tag === "SOUR",
    );
    expect(
      sourceDifference?.updatedGedcomRecord?.children.some(
        (child) => child.tag === "CHAN",
      ),
    ).toBe(true);
  });

  it("submitUrlSuggestion applies the suggestion and saves it directly", async () => {
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(true);
    const updateGedcomDatabaseSpy = vi
      .spyOn(ancestryService, "updateGedcomDatabase")
      .mockResolvedValue(undefined);

    await component.submitUrlSuggestion(source, urlSuggestion);

    expect(updateGedcomDatabaseSpy).toHaveBeenCalledTimes(1);
    const savedDatabase = updateGedcomDatabaseSpy.mock.calls[0]?.[0];
    expect(savedDatabase?.repositories["@R0@"]).toBeDefined();
  });

  it("submitUrlSuggestion does nothing when write permission is denied", async () => {
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(
      false,
    );
    const updateGedcomDatabaseSpy = vi.spyOn(
      ancestryService,
      "updateGedcomDatabase",
    );

    await component.submitUrlSuggestion(source, urlSuggestion);

    expect(updateGedcomDatabaseSpy).not.toHaveBeenCalled();
  });
});

describe("ValidationComponent merge repository links suggestion", () => {
  let component: ValidationComponent;
  let ancestryService: AncestryService;

  const repository = newGedcomRepository({ xref: "@R1@", name: "Example" });
  const source = newGedcomSource({
    xref: "@S1@",
    repositoryLinks: [
      newGedcomRepositoryLink({
        repositoryXref: "@R1@",
        callNumbers: ["one"],
      }),
      newGedcomRepositoryLink({
        repositoryXref: "@R1@",
        callNumbers: ["two"],
      }),
    ],
  });
  const mergeSuggestion: MergeRepositoryLinksSuggestion = {
    repositoryXref: "@R1@",
  };

  beforeEach(async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        sources: { [source.xref]: source },
        repositories: { [repository.xref]: repository },
      }),
    );

    const renderResult = await render(ValidationComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
      waitForStableOnRender: true,
    });
    component = renderResult.fixture.componentInstance;
    ancestryService = TestBed.inject(AncestryService);
  });

  it("lists a warning with a button to review the merge suggestion", async () => {
    expect(await screen.findByText(/Merge repository citations/)).toBeTruthy();
  });

  it("submitMergeSuggestion merges the links and saves it directly", async () => {
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(true);
    const updateGedcomDatabaseSpy = vi
      .spyOn(ancestryService, "updateGedcomDatabase")
      .mockResolvedValue(undefined);

    await component.submitMergeSuggestion(source, mergeSuggestion);

    expect(updateGedcomDatabaseSpy).toHaveBeenCalledTimes(1);
    const savedDatabase = updateGedcomDatabaseSpy.mock.calls[0]?.[0];
    expect(savedDatabase?.sources[source.xref]?.repositoryLinks).toEqual([
      { repositoryXref: "@R1@", callNumbers: ["one", "two"] },
    ]);
  });

  it("submitMergeSuggestion does nothing when write permission is denied", async () => {
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(
      false,
    );
    const updateGedcomDatabaseSpy = vi.spyOn(
      ancestryService,
      "updateGedcomDatabase",
    );

    await component.submitMergeSuggestion(source, mergeSuggestion);

    expect(updateGedcomDatabaseSpy).not.toHaveBeenCalled();
  });
});

describe("ValidationComponent sticky header", () => {
  it("scopes each warning's sticky row to its own section, one per diff", async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        sources: {
          S1: newGedcomSource({
            xref: "S1",
            title:
              "Newfoundland Virtal Records, 1892, Birth of Catherine Cooper https://familysearch.org/ark:/61903/3:1:S3HT-61DS-32F?cc=1790939&wc=M61G-RM3%3A144853601",
          }),
          S2: newGedcomSource({
            xref: "S2",
            title:
              "Second Source https://www.ancestry.com/discoveryui-content/view/123456:7890?tid=111&pid=181",
          }),
          S3: newGedcomSource({
            xref: "S3",
            title:
              "Jackson Daily News, Obituary, 1910 https://www.newspapers.com/clip/56286648/jackson-daily-news/",
          }),
        },
      }),
    );

    await render(ValidationComponent, {
      providers: [provideRouter([])],
      bindings: [inputBinding("ancestryDatabase", ancestryDatabase)],
      waitForStableOnRender: true,
    });

    await screen.findAllByText(/Submit changes as proposed/);

    // One `.sticky-row` per warning with a diff, each the first child of
    // its own `.diff-section`. That's what scopes a `position: sticky`
    // row's "stuck" range to just its own section: the containing block a
    // sticky element sticks within is the nearest block-level ancestor,
    // so each row only ever competes for the top of the page with the
    // content inside its own section, never a different warning's row --
    // unlike putting them all in one shared `<table>`, which is what let
    // two different warnings' sticky rows render on top of each other
    // (the bug in #444).
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".diff-section"),
    );
    expect(sections).toHaveLength(3);
    for (const section of sections) {
      const stickyRows = section.querySelectorAll(".sticky-row");
      expect(stickyRows).toHaveLength(1);
      expect(section.firstElementChild).toBe(stickyRows[0]);
      expect(getComputedStyle(stickyRows[0] as HTMLElement).position).toBe(
        "sticky",
      );
    }
  });
});
