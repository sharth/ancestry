import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { produce } from "immer";
import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { serializeGedcomRecordToText } from "../gedcom/gedcomRecord";
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

describe("AncestryService change-date stamping", () => {
  let ancestryService: AncestryService;

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(MINIMAL_GEDCOM_TEXT))),
    );

    await render(StubComponent, { waitForStableOnRender: true });

    ancestryService = TestBed.inject(AncestryService);
    await ancestryService.openBuiltin();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Regression test for the diff shown in the editor and on the validation
  // page before anything is saved: it comes from compareGedcomDatabase(),
  // so the CHAN bump needs to show up there too, not just in the file
  // written by updateGedcomDatabase().
  it("compareGedcomDatabase shows a CHAN bump for a record that changed, before saving", async () => {
    // liveQuery's change notification from openBuiltin() lands
    // asynchronously, separately from the promise it awaits, so give it a
    // moment to actually reach gedcomResource before reading the database.
    await vi.waitFor(() => {
      expect(ancestryService.ancestryDatabase()).toBeDefined();
    });
    const database = ancestryService.ancestryDatabase();
    assert.isDefined(database);
    const updatedDatabase = produce(database, (draft) => {
      const name = draft.individuals["@I1@"]?.names[0];
      assert.isDefined(name);
      name.givenName = "Jane";
    });

    const differences = ancestryService.compareGedcomDatabase(updatedDatabase);
    const individualDifference = differences.find(
      ({ updatedGedcomRecord }) =>
        updatedGedcomRecord?.tag === "INDI" &&
        updatedGedcomRecord.xref === "@I1@",
    );
    assert.isDefined(individualDifference?.updatedGedcomRecord);

    const text = serializeGedcomRecordToText(
      individualDifference.updatedGedcomRecord,
    ).join("\n");
    expect(text).toContain("CHAN");
  });
});
