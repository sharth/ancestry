import { inputBinding, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it, vi } from "vitest";

import {
  AncestryService,
  newGedcomResourceValue,
} from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import {
  DuplicateRepositoriesComponent,
  findDuplicateRepositories,
  mergeDuplicateRepositories,
} from "./duplicate-repositories.component";

function link(repositoryXref: string, ...callNumbers: string[]) {
  return newGedcomRepositoryLink({ repositoryXref, callNumbers });
}

const database = newGedcomDatabase({
  repositories: {
    "@R1@": newGedcomRepository({ xref: "@R1@", name: "FamilySearch" }),
    "@R2@": newGedcomRepository({ xref: "@R2@", name: "Ancestry" }),
    "@R3@": newGedcomRepository({ xref: "@R3@", name: "FamilySearch " }),
    "@R4@": newGedcomRepository({ xref: "@R4@", name: "" }),
    "@R5@": newGedcomRepository({ xref: "@R5@", name: "" }),
  },
  sources: {
    // Cites only the kept repository: left alone.
    "@S1@": newGedcomSource({ xref: "@S1@", repositoryLinks: [link("@R1@")] }),
    // Cites only the duplicate: repointed.
    "@S2@": newGedcomSource({
      xref: "@S2@",
      repositoryLinks: [link("@R2@", "a"), link("@R3@", "b")],
    }),
    // Cites both: combined into one citation.
    "@S3@": newGedcomSource({
      xref: "@S3@",
      repositoryLinks: [
        link("@R3@", "x", "y"),
        link("@R2@"),
        link("@R1@", "y", "z"),
      ],
    }),
  },
});

describe("findDuplicateRepositories", () => {
  it("groups named repositories with the same name, keeping the first", () => {
    expect(findDuplicateRepositories(database)).toEqual([
      {
        kept: database.repositories["@R1@"],
        duplicates: [database.repositories["@R3@"]],
      },
    ]);
  });
});

describe("mergeDuplicateRepositories", () => {
  const [group] = findDuplicateRepositories(database);
  if (group === undefined) throw new Error();
  const merged = mergeDuplicateRepositories(database, group);

  it("deletes the duplicates", () => {
    expect(Object.keys(merged.repositories)).toEqual([
      "@R1@",
      "@R2@",
      "@R4@",
      "@R5@",
    ]);
  });

  it("leaves a source that only cites the kept repository untouched", () => {
    expect(merged.sources["@S1@"]).toBe(database.sources["@S1@"]);
  });

  it("repoints citations of a duplicate at the kept repository", () => {
    expect(merged.sources["@S2@"]?.repositoryLinks).toEqual([
      link("@R2@", "a"),
      link("@R1@", "b"),
    ]);
  });

  it("combines a source's citations into one, without repeating call numbers", () => {
    expect(merged.sources["@S3@"]?.repositoryLinks).toEqual([
      link("@R1@", "x", "y", "z"),
      link("@R2@"),
    ]);
  });
});

describe("DuplicateRepositoriesComponent", () => {
  async function renderWith(gedcomDatabase: GedcomDatabase) {
    const { fixture } = await render(DuplicateRepositoriesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          signal(newGedcomResourceValue({ gedcomDatabase })),
        ),
      ],
      waitForStableOnRender: true,
    });
    return fixture.componentInstance;
  }

  it("says so when no two repositories share a name", async () => {
    await renderWith(
      newGedcomDatabase({
        repositories: {
          "@R1@": newGedcomRepository({ xref: "@R1@", name: "FamilySearch" }),
        },
      }),
    );
    expect(
      screen.getByText("No two repositories have the same name."),
    ).toBeTruthy();
  });

  it("lists each group with its proposed diff", async () => {
    await renderWith(database);
    expect(
      screen.queryAllByRole("link").map((a) => a.textContent.trim()),
    ).toEqual(["@R1@", "@R3@"]);
    // The diff is against an empty file, so it shows what would be written:
    // merged call numbers, and no @R3@ record.
    expect(document.body.textContent).toContain("2 CALN z");
    expect(document.body.textContent).not.toContain("@R3@ REPO");
  });

  it("reviews in the editor dialog, or submits directly", async () => {
    const component = await renderWith(database);
    const ancestryService = TestBed.inject(AncestryService);
    vi.spyOn(ancestryService, "requestWritePermission").mockResolvedValue(true);
    const updateGedcomDatabaseSpy = vi
      .spyOn(ancestryService, "updateGedcomDatabase")
      .mockResolvedValue(undefined);
    const showModalSpy = vi
      .spyOn(component.editDialog(), "showModal")
      .mockResolvedValue(undefined);

    screen
      .getByRole("button", { name: "Open editor with proposed changes" })
      .click();
    expect(showModalSpy).toHaveBeenCalledTimes(1);
    expect(component.reviewTabs()).toEqual([
      { type: "REPO", xref: "@R1@" },
      { type: "SOUR", xref: "@S1@" },
      { type: "SOUR", xref: "@S2@" },
      { type: "SOUR", xref: "@S3@" },
    ]);
    expect(component.reviewDatabase().repositories["@R3@"]).toBeUndefined();

    screen.getByRole("button", { name: "Submit changes as proposed" }).click();
    await vi.waitFor(() => {
      expect(updateGedcomDatabaseSpy).toHaveBeenCalledTimes(1);
    });
    expect(
      updateGedcomDatabaseSpy.mock.calls[0]?.[0].repositories["@R3@"],
    ).toBeUndefined();
  });
});
