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
import { newGedcomFact } from "../../gedcom/gedcomFact";
import { newGedcomIndividual } from "../../gedcom/gedcomIndividual";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { newGedcomSourceCitation } from "../../gedcom/gedcomSourceCitation";
import {
  DuplicateSourcesComponent,
  findDuplicateSources,
} from "./duplicate-sources.component";

const sources = {
  "@S1@": newGedcomSource({ xref: "@S1@", title: "1900 Census" }),
  "@S2@": newGedcomSource({ xref: "@S2@", title: "Parish register" }),
  "@S3@": newGedcomSource({ xref: "@S3@", title: " 1900 Census " }),
  "@S4@": newGedcomSource({ xref: "@S4@", title: "" }),
  "@S5@": newGedcomSource({ xref: "@S5@", title: "" }),
};

const individuals = {
  "@I1@": newGedcomIndividual({
    xref: "@I1@",
    facts: [
      newGedcomFact({
        tag: "BIRT",
        citations: [newGedcomSourceCitation({ sourceXref: "@S3@" })],
      }),
    ],
  }),
};

describe("findDuplicateSources", () => {
  it("groups sources by trimmed title, ignoring untitled sources", () => {
    expect(
      findDuplicateSources(newGedcomDatabase({ sources })).map((group) => [
        group.title,
        group.kept.xref,
        group.duplicates.map((source) => source.xref),
      ]),
    ).toEqual([["1900 Census", "@S1@", ["@S3@"]]]);
  });
});

describe("DuplicateSourcesComponent", () => {
  async function renderWith(database: GedcomDatabase) {
    const { fixture } = await render(DuplicateSourcesComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          signal(newGedcomResourceValue({ gedcomDatabase: database })),
        ),
      ],
      waitForStableOnRender: true,
    });
    return fixture.componentInstance;
  }

  it("says so when no two sources share a title", async () => {
    await renderWith(
      newGedcomDatabase({ sources: { "@S2@": sources["@S2@"] } }),
    );
    expect(screen.getByText("No two sources share a title.")).toBeTruthy();
  });

  it("lists each group with its proposed diff", async () => {
    await renderWith(newGedcomDatabase({ sources, individuals }));
    expect(
      screen.queryAllByRole("link").map((link) => link.textContent.trim()),
    ).toEqual(["@S1@", "@S3@"]);
    expect(document.body.textContent).toContain("2 SOUR @S1@");
  });

  it("lists each group's conflicts", async () => {
    await renderWith(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({ xref: "@S1@", title: "A", text: "one" }),
          "@S2@": newGedcomSource({ xref: "@S2@", title: "A", text: "two" }),
          "@S3@": newGedcomSource({ xref: "@S3@", title: "B" }),
          "@S4@": newGedcomSource({ xref: "@S4@", title: "B" }),
        },
      }),
    );
    expect(screen.getByText("TEXT of @S2@ differs")).toBeTruthy();
    expect(screen.getByText("None")).toBeTruthy();
  });

  it("reviews in the editor dialog, or submits directly", async () => {
    const component = await renderWith(
      newGedcomDatabase({ sources, individuals }),
    );
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
    expect(component.reviewTabs()).toEqual([{ type: "SOUR", xref: "@S1@" }]);
    expect(component.reviewDatabase().sources["@S3@"]).toBeUndefined();

    screen.getByRole("button", { name: "Submit changes as proposed" }).click();
    await vi.waitFor(() => {
      expect(updateGedcomDatabaseSpy).toHaveBeenCalledTimes(1);
    });
    for (const [saved] of updateGedcomDatabaseSpy.mock.calls) {
      expect(saved.sources["@S3@"]).toBeUndefined();
      expect(
        saved.individuals["@I1@"]?.facts[0]?.citations[0]?.sourceXref,
      ).toBe("@S1@");
    }
  });
});
