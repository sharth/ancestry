import { computed, inputBinding, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  provideRouter,
  Router,
  RouterOutlet,
  withComponentInputBinding,
  withRouterResources,
} from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AncestryService,
  newGedcomResourceValue,
} from "../../database/ancestry.service";
import { newGedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSource } from "../../gedcom/gedcomSource";
import { routes } from "../app.routes";
import { ValidationComponent } from "./validation.component";

describe("ValidationComponent", () => {
  beforeEach(async () => {
    const source = newGedcomSource({
      xref: "S1",
      text: "Found at https://example.com/record",
    });
    const ancestryDatabase = signal(
      newGedcomDatabase({ sources: { [source.xref]: source } }),
    );
    await render(ValidationComponent, {
      providers: [provideRouter([])],
      bindings: [
        inputBinding(
          "gedcom",
          computed(() =>
            newGedcomResourceValue({ gedcomDatabase: ancestryDatabase() }),
          ),
        ),
      ],
      waitForStableOnRender: true,
    });
  });

  it("links each tab to its own child route", () => {
    expect(
      screen
        .getByRole("link", { name: /^Unused sources/ })
        .getAttribute("href"),
    ).toBe("/unused-sources");
  });

  it("shows each tab's finding count on the tab", () => {
    const counts = Object.fromEntries(
      screen
        .getAllByRole("link")
        .map((tab): [string, string] => [
          tab.firstChild?.textContent?.trim() ?? "",
          tab.querySelector(".badge")?.textContent.trim() ?? "",
        ]),
    );
    expect(counts).toEqual({
      "Source warnings": "0",
      "Sources without repositories": "1",
      "Duplicate call numbers": "0",
      "Duplicate repositories": "0",
      "Duplicate sources": "0",
      "Unused sources": "1",
      "Unused multimedia": "0",
      "Bibliography without title": "0",
      "Tree ids": "0",
      "Outdated URLs": "0",
    });
  });
});

describe("ValidationComponent routing", () => {
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            ["0 HEAD", "0 @S1@ SOUR", "1 TITL Orphan", "0 TRLR", ""].join("\n"),
          ),
        ),
      ),
    );
    await render("<router-outlet />", {
      imports: [RouterOutlet],
      providers: [
        provideRouter(
          routes,
          withComponentInputBinding(),
          withRouterResources(),
        ),
      ],
      waitForStableOnRender: true,
    });
    router = TestBed.inject(Router);
    await TestBed.inject(AncestryService).openBuiltin();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the first tab by default", async () => {
    await router.navigateByUrl("/validation");
    expect(router.url).toBe("/validation/source-warnings");
    const tab = await screen.findByRole("link", { name: /^Source warnings/ });
    expect(tab.classList).toContain("active");
  });

  it("shows the check whose tab's route is open", async () => {
    await router.navigateByUrl("/validation/unused-sources");
    expect(
      (await screen.findByRole("link", { name: /^Unused sources/ })).classList,
    ).toContain("active");
    expect(await screen.findByRole("link", { name: "@S1@" })).toBeTruthy();
    expect(document.querySelector("app-source-warnings")).toBeNull();
  });
});
