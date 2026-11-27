import { Location } from "@angular/common";
import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  Router,
  RouterOutlet,
  provideRouter,
  withComponentInputBinding,
  withRouterResources,
} from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService } from "../database/ancestry.service";
import { routes } from "./app.routes";

// A minimal but valid GEDCOM file, served in place of the real royal-family
// sample (see ancestry.service.spec.ts for why): just enough for
// parseGedcomDatabase to accept without throwing.
const MINIMAL_GEDCOM_TEXT = [
  "0 HEAD",
  "0 @I1@ INDI",
  "1 NAME John /Doe/",
  "0 TRLR",
  "",
].join("\n");

@Component({ selector: "app-stub", template: "" })
class StubComponent {}

describe("place route", () => {
  let ancestryService: AncestryService;
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(MINIMAL_GEDCOM_TEXT))),
    );

    await render(StubComponent, {
      providers: [
        provideRouter(
          routes,
          withComponentInputBinding(),
          withRouterResources(),
        ),
      ],
      waitForStableOnRender: true,
    });

    ancestryService = TestBed.inject(AncestryService);
    router = TestBed.inject(Router);
    await ancestryService.openBuiltin();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves every matched segment, lowercased, into a path array", async () => {
    await router.navigateByUrl("/place/United-States/Maryland/Cecil-County");

    const route = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(route?.data["path"]).toEqual([
      "united-states",
      "maryland",
      "cecil-county",
    ]);
  });

  it("matches with no further segments", async () => {
    await router.navigateByUrl("/place");

    const route = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(route?.data["path"]).toEqual([]);
  });
});

@Component({
  selector: "app-outlet-stub",
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class OutletStubComponent {}

describe("data routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Pages get the database through the route's resources, which the router
  // keeps bound to the loaded file: a save's reload reaches the page in the
  // same render as everything else, with no navigation to refresh it.
  it("show a reloaded file without navigating", async () => {
    let gedcomText = MINIMAL_GEDCOM_TEXT;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(gedcomText))),
    );
    await render(OutletStubComponent, {
      providers: [
        provideRouter(
          routes,
          withComponentInputBinding(),
          withRouterResources(),
        ),
      ],
      waitForStableOnRender: true,
    });
    const ancestryService = TestBed.inject(AncestryService);
    const router = TestBed.inject(Router);
    await ancestryService.openBuiltin();
    await router.navigateByUrl("/individuals");
    expect(await screen.findByText("1 Individuals")).toBeTruthy();

    const navigate = vi.spyOn(router, "navigateByUrl");
    gedcomText = MINIMAL_GEDCOM_TEXT.replace("0 TRLR", "0 @I2@ INDI\n0 TRLR");
    ancestryService.gedcomResource.reload();

    expect(await screen.findByText("2 Individuals")).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("individual route", () => {
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(MINIMAL_GEDCOM_TEXT))),
    );
    await render(OutletStubComponent, {
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

  it("shows an individual that's in the file", async () => {
    await router.navigateByUrl("/individual/@I1@");

    expect(await screen.findByRole("heading", { name: "Name" })).toBeTruthy();
    expect(screen.queryByText("Page not found")).toBeNull();
  });

  it("shows the not-found page at the requested URL for an unknown xref", async () => {
    await router.navigateByUrl("/individual/@I9@");

    expect(
      await screen.findByRole("heading", { name: "Page not found" }),
    ).toBeTruthy();
    expect(TestBed.inject(Location).path()).toBe("/individual/@I9@/facts");
  });
});
