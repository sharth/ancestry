import { Component, Injector } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { TestBed } from "@angular/core/testing";
import { Router, provideRouter } from "@angular/router";
import { render } from "@testing-library/angular/zoneless";
import { filter, firstValueFrom } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { newGedcomDatabase } from "../gedcom/gedcomDatabase";
import {
  AncestryService,
  ancestryDatabaseGuard,
  newGedcomResourceValue,
} from "./ancestry.service";

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

describe("ancestryDatabaseGuard", () => {
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
            canActivate: [ancestryDatabaseGuard],
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
    // (and readable back out of it) well before the guard ever runs, so
    // a redirect here would mean the guard acted on a stale "nothing
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
    // the promise clearDatabase() awaits, so give it a moment to
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
describe("AncestryService save history", () => {
  let ancestryService: AncestryService;
  let fileHandle: FileSystemFileHandle;

  async function writeFile(text: string) {
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  // Loads the test file into gedcomResource. A save's reload() drops it
  // again, since no data source is stored.
  function useFile() {
    ancestryService.gedcomResource.set(
      newGedcomResourceValue({ gedcomFileHandle: fileHandle }),
    );
  }

  async function readFile() {
    return (await fileHandle.getFile()).text();
  }

  beforeEach(async () => {
    // The origin private file system gives a real FileSystemFileHandle
    // without a file picker. It's handed straight to gedcomResource rather
    // than stored through openGedcom(), since storing an origin private
    // file system handle in IndexedDB crashes some test browsers.
    const root = await navigator.storage.getDirectory();
    fileHandle = await root.getFileHandle("history.ged", { create: true });
    await writeFile(MINIMAL_GEDCOM_TEXT);

    ancestryService = TestBed.inject(AncestryService);
    await ancestryService.dexieDatabase.saves.clear();
    await firstValueFrom(
      toObservable(ancestryService.gedcomResource.isLoading, {
        injector: TestBed.inject(Injector),
      }).pipe(filter((isLoading) => !isLoading)),
    );
    useFile();
  });

  afterEach(async () => {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry("history.ged");
  });

  it("keeps the file's previous text on each save", async () => {
    const gedcomDatabase = newGedcomDatabase();
    await ancestryService.updateGedcomDatabase(gedcomDatabase);

    const saves = await ancestryService.dexieDatabase.saves.toArray();
    expect(saves).toHaveLength(1);
    expect(saves[0]).toMatchObject({
      gedcomFilename: "history.ged",
      gedcomText: MINIMAL_GEDCOM_TEXT,
    });
    expect(await readFile()).not.toContain("John /Doe/");
  });

  it("restores a saved copy, keeping the replaced text too", async () => {
    await ancestryService.updateGedcomDatabase(newGedcomDatabase());
    const savedText = await readFile();
    const [save] = await ancestryService.dexieDatabase.saves.toArray();

    useFile();
    await ancestryService.restoreGedcomSave(save?.id ?? -1);

    expect(await readFile()).toBe(MINIMAL_GEDCOM_TEXT);
    const saves = await ancestryService.dexieDatabase.saves.toArray();
    expect(saves.map((s) => s.gedcomText)).toEqual([
      MINIMAL_GEDCOM_TEXT,
      savedText,
    ]);
  });
});
