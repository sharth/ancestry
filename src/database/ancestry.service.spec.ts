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

import {
  newGedcomDatabase,
  parseGedcomDatabase,
} from "../gedcom/gedcomDatabase";
import { newGedcomRecord, parseGedcomRecords } from "../gedcom/gedcomRecord";
import {
  AncestryService,
  GedcomFileChangedError,
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

describe("AncestryService.gedcomDatabaseDifferences", () => {
  const unchanged = {
    originalGedcomRecord: newGedcomRecord({ xref: "@S1@", tag: "SOUR" }),
    updatedGedcomRecord: newGedcomRecord({ xref: "@S1@", tag: "SOUR" }),
  };
  const edited = {
    originalGedcomRecord: newGedcomRecord({
      xref: "@S2@",
      tag: "SOUR",
      children: [newGedcomRecord({ tag: "TITL", value: "Old" })],
    }),
    updatedGedcomRecord: newGedcomRecord({
      xref: "@S2@",
      tag: "SOUR",
      children: [newGedcomRecord({ tag: "TITL", value: "New" })],
    }),
  };
  const added = {
    updatedGedcomRecord: newGedcomRecord({ xref: "@R1@", tag: "REPO" }),
  };
  const removed = {
    originalGedcomRecord: newGedcomRecord({ xref: "@S3@", tag: "SOUR" }),
  };

  let ancestryService: AncestryService;

  beforeEach(() => {
    ancestryService = TestBed.inject(AncestryService);
    vi.spyOn(ancestryService, "compareGedcomDatabase").mockReturnValue([
      unchanged,
      edited,
      added,
      removed,
    ]);
  });

  it("lists only the records that would be written differently", () => {
    expect(
      ancestryService.gedcomDatabaseDifferences(newGedcomDatabase()),
    ).toEqual([edited, added, removed]);
  });

  it("also lists an unchanged record whose xref is always included", () => {
    expect(
      ancestryService.gedcomDatabaseDifferences(
        newGedcomDatabase(),
        new Set(["@S1@"]),
      ),
    ).toEqual([unchanged, edited, added, removed]);
  });
});

describe("AncestryService.updateGedcomDatabase", () => {
  let ancestryService: AncestryService;
  let gedcomFileHandle: FileSystemFileHandle;

  async function writeFile(text: string) {
    const writable = await gedcomFileHandle.createWritable();
    await writable.write(text);
    await writable.close();
  }

  async function readFile(): Promise<string> {
    return (await gedcomFileHandle.getFile()).text();
  }

  function loadedDatabase() {
    const database = ancestryService.gedcomResource.value()?.gedcomDatabase;
    if (database === undefined) throw new Error("nothing loaded");
    return database;
  }

  // The loaded database with @I1@'s given name edited, as an editor would.
  function renameJohnToJane() {
    return produce(loadedDatabase(), (draft) => {
      const name = draft.individuals["@I1@"]?.names[0];
      if (name) name.givenName = "Jane";
    });
  }

  beforeEach(async () => {
    // A real file in the browser's origin-private file system, so the save
    // goes through the same FileSystemFileHandle calls as a user's file.
    const root = await navigator.storage.getDirectory();
    gedcomFileHandle = await root.getFileHandle("update-test.ged", {
      create: true,
    });
    await writeFile(MINIMAL_GEDCOM_TEXT);

    ancestryService = TestBed.inject(AncestryService);
    // Let the (empty) first load from IndexedDB land, so it can't replace
    // the value set below.
    await vi.waitFor(() => {
      if (ancestryService.gedcomResource.isLoading()) {
        throw new Error("still loading");
      }
    });
    const gedcomRecords = parseGedcomRecords(MINIMAL_GEDCOM_TEXT);
    ancestryService.gedcomResource.set(
      newGedcomResourceValue({
        dataSource: { mode: "gedcom", gedcomHandle: gedcomFileHandle },
        gedcomFileHandle,
        gedcomText: MINIMAL_GEDCOM_TEXT,
        gedcomRecords,
        gedcomDatabase: parseGedcomDatabase(gedcomRecords),
      }),
    );
  });

  it("writes the edit when the file is unchanged since it was loaded", async () => {
    const edited = renameJohnToJane();

    await ancestryService.updateGedcomDatabase(loadedDatabase(), edited);

    expect(await readFile()).toContain("2 GIVN Jane");
  });

  it("tells other tabs it saved", async () => {
    const otherTab = new BroadcastChannel("ancestry-gedcom-saved");
    const received = new Promise<unknown>((resolve) => {
      otherTab.onmessage = (event) => {
        resolve(event.data);
      };
    });

    await ancestryService.updateGedcomDatabase(
      loadedDatabase(),
      renameJohnToJane(),
    );

    await expect(received).resolves.toBe("saved");
    otherTab.close();
  });

  it("refuses to save an edit of a database that has since been reloaded", async () => {
    const edited = renameJohnToJane();
    const stale = loadedDatabase();
    const current = ancestryService.gedcomResource.value();
    assert.isOk(current);
    // Another tab's save reloaded the file into a new database object.
    ancestryService.gedcomResource.set({
      ...current,
      gedcomDatabase: parseGedcomDatabase(current.gedcomRecords),
    });

    await expect(
      ancestryService.updateGedcomDatabase(stale, edited),
    ).rejects.toBeInstanceOf(GedcomFileChangedError);

    expect(await readFile()).toBe(MINIMAL_GEDCOM_TEXT);
  });

  it("refuses to overwrite a file that changed after it was loaded", async () => {
    const changedElsewhere = MINIMAL_GEDCOM_TEXT.replace(
      "John /Doe/",
      "Johnny /Doe/",
    );
    await writeFile(changedElsewhere);
    const edited = renameJohnToJane();

    await expect(
      ancestryService.updateGedcomDatabase(loadedDatabase(), edited),
    ).rejects.toBeInstanceOf(GedcomFileChangedError);

    expect(await readFile()).toBe(changedElsewhere);
  });
});

describe("AncestryService across tabs", () => {
  // Stands in for another tab: a channel of the same name in this page.
  let otherTab: BroadcastChannel;

  beforeEach(() => {
    otherTab = new BroadcastChannel("ancestry-gedcom-saved");
  });

  afterEach(() => {
    otherTab.close();
  });

  it("reloads the file when another tab saves it", async () => {
    const ancestryService = TestBed.inject(AncestryService);
    const reloadSpy = vi.spyOn(ancestryService.gedcomResource, "reload");

    otherTab.postMessage("saved");

    await vi.waitFor(() => {
      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});
