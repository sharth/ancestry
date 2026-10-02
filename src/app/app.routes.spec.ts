import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
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
      providers: [provideRouter(routes, withComponentInputBinding())],
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
