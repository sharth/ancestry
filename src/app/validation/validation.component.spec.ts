import { inputBinding, signal } from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { ValidationComponent } from "./validation.component";

describe("ValidationComponent", () => {
  let component: ValidationComponent;
  let fixture: ComponentFixture<ValidationComponent>;
  let ancestryService: AncestryService;

  beforeEach(async () => {
    const ancestryDatabase = signal(
      newGedcomDatabase({
        sources: {
          S1: newGedcomSource({
            xref: "S1",
            text: "Found at https://example.com/record",
          }),
        },
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

  it("submitProposed applies the suggestion and saves it directly", async () => {
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(true);
    const updateGedcomDatabaseSpy = vi
      .spyOn(ancestryService, "updateGedcomDatabase")
      .mockResolvedValue(undefined);

    await component.submitProposed("S1");

    expect(updateGedcomDatabaseSpy).toHaveBeenCalledTimes(1);
    const savedDatabase = updateGedcomDatabaseSpy.mock.calls[0]?.[0];
    expect(savedDatabase?.repositories["@R0@"]).toBeDefined();
  });

  it("submitProposed does nothing when write permission is denied", async () => {
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(
      false,
    );
    const updateGedcomDatabaseSpy = vi.spyOn(
      ancestryService,
      "updateGedcomDatabase",
    );

    await component.submitProposed("S1");

    expect(updateGedcomDatabaseSpy).not.toHaveBeenCalled();
  });
});

describe("ValidationComponent sticky toolbar", () => {
  it("shows only one toolbar at a time while scrolling through multiple diffs", async () => {
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

    // Waits for the IntersectionObserver callbacks triggered by a scroll to
    // settle (the DOM stops changing for a beat), rather than a fixed
    // delay, so this isn't flaky under a loaded CI machine.
    async function toolbarCountAfterSettling(): Promise<number> {
      let lastCount = document.querySelectorAll(".sticky-toolbar").length;
      let lastChangeAt = Date.now();
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 16));
        const count = document.querySelectorAll(".sticky-toolbar").length;
        if (count !== lastCount) {
          lastCount = count;
          lastChangeAt = Date.now();
        } else if (Date.now() - lastChangeAt > 150) {
          break;
        }
      }
      return lastCount;
    }

    // Scroll the window down through the page in steps, checking at each
    // one that at most one `.sticky-toolbar` is rendered -- never two
    // simultaneously, which was the overlap bug this test guards against.
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const stepCount = 10;
    let sawToolbar = false;
    for (let step = 0; step <= stepCount; step++) {
      window.scrollTo(0, Math.round((maxScroll * step) / stepCount));
      window.dispatchEvent(new Event("scroll"));
      const toolbarCount = await toolbarCountAfterSettling();
      expect(toolbarCount).toBeLessThanOrEqual(1);
      if (toolbarCount > 0) sawToolbar = true;
    }
    expect(sawToolbar).toBe(true);
  });
});
