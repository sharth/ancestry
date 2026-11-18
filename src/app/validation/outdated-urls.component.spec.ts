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
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { OutdatedUrlsComponent } from "./outdated-urls.component";

const oldUrl =
  "https://civilrecords.irishgenealogy.ie/churchrecords/details-civil/9cbd434898349";
const newUrl = "https://www.irishgenealogy.ie/view/?record_id=cide-4898349";

const deathSource = newGedcomSource({
  xref: "@S1@",
  abbr: "Death of John Doe",
  repositoryLinks: [
    newGedcomRepositoryLink({
      repositoryXref: "@R1@",
      callNumbers: [oldUrl],
    }),
  ],
});

const database = newGedcomDatabase({
  sources: {
    "@S1@": deathSource,
    "@S2@": newGedcomSource({ xref: "@S2@" }),
  },
});

describe("OutdatedUrlsComponent", () => {
  async function renderWith(gedcomDatabase: GedcomDatabase) {
    const { fixture } = await render(OutdatedUrlsComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          signal(newGedcomResourceValue({ gedcomDatabase: gedcomDatabase })),
        ),
      ],
      waitForStableOnRender: true,
    });
    return fixture.componentInstance;
  }

  it("says so when no call number is an outdated URL", async () => {
    await renderWith(
      newGedcomDatabase({
        sources: { "@S2@": newGedcomSource({ xref: "@S2@" }) },
      }),
    );
    expect(screen.getByText("No call number is an outdated URL.")).toBeTruthy();
  });

  it("links the source, the old URL and the new URL, with the proposed diff", async () => {
    await renderWith(database);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent.trim())).toEqual([
      "Death of John Doe",
      oldUrl,
      newUrl,
    ]);
    for (const link of links.slice(1)) {
      expect(link.getAttribute("href")).toBe(link.textContent.trim());
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    }
    expect(document.body.textContent).toContain(`2 CALN ${newUrl}`);
  });

  it("lists a call number with no new URL, with nothing to submit", async () => {
    await renderWith(
      newGedcomDatabase({
        sources: {
          "@S1@": newGedcomSource({ ...deathSource, abbr: "Civil record" }),
        },
      }),
    );
    expect(
      screen.getByText(
        "No suggestion: the source's title doesn't say which kind of record it is.",
      ),
    ).toBeTruthy();
    expect(screen.queryAllByRole("button")).toEqual([]);
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
    expect(component.reviewTabs()).toEqual([{ type: "SOUR", xref: "@S1@" }]);
    expect(
      component.reviewDatabase().sources["@S1@"]?.repositoryLinks[0]
        ?.callNumbers,
    ).toEqual([newUrl]);

    screen.getByRole("button", { name: "Submit changes as proposed" }).click();
    screen.getByRole("button", { name: "Submit all 1 as proposed" }).click();
    await vi.waitFor(() => {
      expect(updateGedcomDatabaseSpy).toHaveBeenCalledTimes(2);
    });
    for (const [saved] of updateGedcomDatabaseSpy.mock.calls) {
      expect(saved.sources["@S1@"]?.repositoryLinks[0]?.callNumbers).toEqual([
        newUrl,
      ]);
    }
  });
});
