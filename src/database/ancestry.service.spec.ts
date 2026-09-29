import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AncestryService, ancestryDatabaseResolver } from "./ancestry.service";

@Component({ selector: "app-stub", template: "" })
class StubComponent {}

// A minimal but valid GEDCOM file: enough for parseGedcomDatabase to accept
// without throwing, without depending on the much larger bundled
// royal-family.ged sample. Served in place of the real asset (see the fetch
// stub below) since a "builtin" data source is a plain, structured-clonable
// object Dexie can store directly -- unlike a FileSystemFileHandle, which a
// fake object can't stand in for once IndexedDB tries to clone it.
const MINIMAL_GEDCOM_TEXT = [
  "0 HEAD",
  "0 @I1@ INDI",
  "1 NAME John /Doe/",
  "0 TRLR",
  "",
].join("\n");

describe("ancestryDatabaseResolver", () => {
  let ancestryService: AncestryService;
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(MINIMAL_GEDCOM_TEXT))),
    );

    await render(StubComponent, {
      providers: [
        provideRouter([
          {
            path: "",
            component: StubComponent,
            resolve: { ancestryDatabase: ancestryDatabaseResolver },
            runGuardsAndResolvers: "always",
          },
          { path: "settings", component: StubComponent },
        ]),
      ],
      waitForStableOnRender: true,
    });

    ancestryService = TestBed.inject(AncestryService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to /settings when no data source is stored in IndexedDB", async () => {
    await router.navigateByUrl("/");

    expect(router.url).toBe("/settings");
  });

  it("does not redirect when a data source was already stored before navigation", async () => {
    // This is the regression case: the data source is committed to Dexie
    // (and readable back out of it) well before the resolver ever runs, so
    // a redirect here would mean the resolver acted on a stale "nothing
    // loaded yet" signal rather than what's actually in IndexedDB.
    await ancestryService.openBuiltin();

    await router.navigateByUrl("/");

    expect(router.url).toBe("/");
  });

  it("redirects to /settings if the stored data source is later cleared", async () => {
    await ancestryService.openBuiltin();
    await router.navigateByUrl("/");
    expect(router.url).toBe("/");

    await ancestryService.clearDatabase();
    // liveQuery's change notification lands asynchronously, separately from
    // the transaction promise clearDatabase() awaits, so give it a moment to
    // actually reach gedcomResource before navigating again.
    await vi.waitFor(() => {
      expect(
        ancestryService.gedcomResource.value()?.dataSource,
      ).toBeUndefined();
    });
    await router.navigateByUrl("/", { onSameUrlNavigation: "reload" });

    expect(router.url).toBe("/settings");
  });
});

// A GEDCOM file where a FAM's CHIL points at an INDI xref that doesn't
// exist -- the same shape of problem the bundled royal-family.ged sample
// had (see gedcom/royal-family-sample.spec.ts). parseGedcomDatabase treats
// this as a hard error.
const GEDCOM_WITH_DANGLING_REFERENCE_TEXT = [
  "0 HEAD",
  "0 @F1@ FAM",
  "1 CHIL @I404@",
  "0 TRLR",
  "",
].join("\n");

describe("AncestryService.ancestryDatabaseError", () => {
  let ancestryService: AncestryService;
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response(GEDCOM_WITH_DANGLING_REFERENCE_TEXT)),
      ),
    );

    await render(StubComponent, {
      providers: [
        provideRouter([
          {
            path: "",
            component: StubComponent,
            resolve: { ancestryDatabase: ancestryDatabaseResolver },
            runGuardsAndResolvers: "always",
          },
          { path: "settings", component: StubComponent },
        ]),
      ],
      waitForStableOnRender: true,
    });

    ancestryService = TestBed.inject(AncestryService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is set, and the resolver redirects instead of throwing, when the GEDCOM file fails to parse", async () => {
    await ancestryService.openBuiltin();

    // This is the regression case for the bug this test guards: before,
    // ancestryDatabaseResolver read AncestryService.ancestryDatabase()
    // directly, so a parse failure threw out of the resolver uncaught and
    // silently aborted the navigation (the user stayed on whatever page
    // they navigated from, with no indication why).
    await router.navigateByUrl("/");

    expect(router.url).toBe("/settings");
    expect(ancestryService.ancestryDatabase()).toBeUndefined();
    expect(ancestryService.ancestryDatabaseError()?.message).toContain(
      "@F1@",
    );
  });
});
