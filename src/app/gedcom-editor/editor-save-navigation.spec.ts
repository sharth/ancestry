import { ApplicationRef, Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  Router,
  RouterOutlet,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { render, screen } from "@testing-library/angular/zoneless";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AncestryService } from "../../database/ancestry.service";
import { routes } from "../app.routes";

/**
 * Regression test for a bug that kept coming back across the GEDCOM
 * editor's various entry points (individual, source, family, repository,
 * multimedia, validation): hitting Save in the editor dialog triggered
 * the browser's own "leave without saving" prompt.
 *
 * The root cause lived in the one `<form>` shared by every entry point
 * (gedcom-editor.component.html): its `(submit)` handler never called
 * `event.preventDefault()`, so the browser fell back to its default
 * submit behavior -- a real navigation to the current URL -- which raced
 * the async save and tripped `GedcomEditorDialogComponent`'s
 * `beforeunload` listener before the save had finished. Previous fixes
 * targeted the Angular Router's CanDeactivate guard instead, which this
 * bug doesn't go through at all (it's a native browser navigation, not
 * an Angular one), so they never actually addressed it.
 *
 * This test exercises the real `<form>` submit (via `requestSubmit()`,
 * which -- unlike dispatching a synthetic "submit" event -- triggers the
 * browser's actual default action when not prevented) through every
 * routed page that embeds the editor dialog, using the real app routes
 * and the real dialog/editor templates rather than calling component
 * methods directly.
 */

const MINIMAL_GEDCOM_TEXT = [
  "0 HEAD",
  "0 @I1@ INDI",
  "1 NAME John /Doe/",
  "1 FAMS @F1@",
  "0 @F1@ FAM",
  "1 HUSB @I1@",
  "0 @S1@ SOUR",
  "1 TEXT Found at https://example.com/record",
  "0 @R1@ REPO",
  "1 NAME Example Repository",
  "0 @O1@ OBJE",
  "0 TRLR",
  "",
].join("\n");

@Component({
  selector: "app-stub",
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class StubComponent {}

const entryPoints: { route: string; editLabel: RegExp }[] = [
  { route: "/individuals", editLabel: /Add individual/ },
  { route: "/individual/@I1@", editLabel: /Edit individual/ },
  { route: "/families", editLabel: /Add family/ },
  { route: "/family/@F1@", editLabel: /Edit family/ },
  { route: "/sources", editLabel: /Add source/ },
  { route: "/source/@S1@", editLabel: /Edit source/ },
  { route: "/repositories", editLabel: /Add repository/ },
  { route: "/repository/@R1@", editLabel: /Edit repository/ },
  { route: "/multimedias", editLabel: /Add multimedia/ },
  { route: "/multimedia/@O1@", editLabel: /Edit multimedia/ },
];

describe("saving the GEDCOM editor from every entry point", () => {
  let ancestryService: AncestryService;
  let router: Router;

  // Letting the editor dialog's form fully render and then re-render
  // (after the save + reload) can, during teardown, hit a known,
  // pre-existing fragility: immer's dev-mode autoFreeze deep-freezes the
  // produce()-derived database, and Signal Forms then tries to attach its
  // own tracking metadata onto those frozen objects. It's orthogonal to
  // what this suite checks (see [[ancestry-immer-freeze-signal-forms]]),
  // so it's swallowed here rather than failing the run.
  function ignoreKnownImmerFreezeRejection(event: PromiseRejectionEvent) {
    if (
      event.reason instanceof TypeError &&
      event.reason.message.includes("object is not extensible")
    ) {
      event.preventDefault();
    }
  }

  beforeAll(() => {
    window.addEventListener(
      "unhandledrejection",
      ignoreKnownImmerFreezeRejection,
    );
  });

  afterAll(() => {
    window.removeEventListener(
      "unhandledrejection",
      ignoreKnownImmerFreezeRejection,
    );
  });

  beforeEach(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(MINIMAL_GEDCOM_TEXT))),
    );

    await render(StubComponent, {
      providers: [provideRouter(routes, withComponentInputBinding())],
      waitForStableOnRender: true,
    });

    router = TestBed.inject(Router);
    ancestryService = TestBed.inject(AncestryService);
    await ancestryService.openBuiltin();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  for (const { route, editLabel } of entryPoints) {
    it(`does not fall back to a real page navigation on save (${route})`, async () => {
      const updateGedcomDatabaseSpy = vi
        .spyOn(ancestryService, "updateGedcomDatabase")
        .mockResolvedValue(undefined);
      const confirmSpy = vi.spyOn(window, "confirm");

      await router.navigateByUrl(route);

      const editButton = await screen.findByRole("button", {
        name: editLabel,
      });
      editButton.click();

      const dialog = await screen.findByRole<HTMLDialogElement>("dialog", {
        hidden: true,
      });
      await vi.waitFor(() => {
        expect(dialog.open).toBe(true);
      });

      const form = dialog.querySelector("form");
      expect(form).toBeTruthy();
      form?.requestSubmit();

      await vi.waitFor(() => {
        expect(updateGedcomDatabaseSpy).toHaveBeenCalled();
      });

      // The real failure mode: an un-prevented native submit navigates the
      // page away, which would have torn down this fixture (and, in the
      // real app, raced the save with the browser's own unload prompt).
      // (individual/family routes redirect to their "facts" child route.)
      expect(router.url.startsWith(route)).toBe(true);
      expect(confirmSpy).not.toHaveBeenCalled();

      // Navigate away and let things settle before the fixture is torn
      // down, rather than leaving the editor's signal graph to recompute
      // against a stale, already-saved database during teardown (a known,
      // pre-existing fragility of combining immer's dev-mode autoFreeze
      // with Signal Forms -- see [[ancestry-immer-freeze-signal-forms]]).
      await router.navigateByUrl("/settings");
      await TestBed.inject(ApplicationRef).whenStable();
    });
  }

  // The validation page's editor dialog is wired up differently from the
  // others (it's always present in the template, opened by a "review this
  // suggestion" button rather than an "Edit"/"Add" pencil button), so it
  // gets its own case rather than fitting the table above -- but it
  // renders the same shared <form>, so the same bug applied here too.
  it("does not fall back to a real page navigation on save (/validation)", async () => {
    const updateGedcomDatabaseSpy = vi
      .spyOn(ancestryService, "updateGedcomDatabase")
      .mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm");

    await router.navigateByUrl("/validation");

    const reviewButton = await screen.findByText(/Open editor with proposed/);
    reviewButton.click();

    const dialog = await screen.findByRole<HTMLDialogElement>("dialog", {
      hidden: true,
    });
    await vi.waitFor(() => {
      expect(dialog.open).toBe(true);
    });

    const form = dialog.querySelector("form");
    expect(form).toBeTruthy();
    form?.requestSubmit();

    await vi.waitFor(() => {
      expect(updateGedcomDatabaseSpy).toHaveBeenCalled();
    });

    expect(router.url).toBe("/validation");
    expect(confirmSpy).not.toHaveBeenCalled();

    await router.navigateByUrl("/settings");
    await TestBed.inject(ApplicationRef).whenStable();
  });
});
