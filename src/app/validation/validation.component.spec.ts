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
