import { TestBed } from "@angular/core/testing";
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  confirmUnsavedChangesGuard,
  UnsavedChangesTracker,
  type ComponentWithUnsavedChanges,
} from "./unsaved-changes.guard";

describe("confirmUnsavedChangesGuard", () => {
  const currentRoute = {} as ActivatedRouteSnapshot;
  const currentState = {} as RouterStateSnapshot;
  const nextState = {} as RouterStateSnapshot;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function runGuard(): boolean {
    return TestBed.runInInjectionContext(() =>
      confirmUnsavedChangesGuard(
        undefined,
        currentRoute,
        currentState,
        nextState,
      ),
    ) as boolean;
  }

  it("allows navigation without prompting when nothing is registered", () => {
    const confirmSpy = vi.spyOn(window, "confirm");

    expect(runGuard()).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("allows navigation without prompting when a registered component has no unsaved changes", () => {
    const tracker = TestBed.inject(UnsavedChangesTracker);
    const component: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => false,
    };
    tracker.register(component);
    const confirmSpy = vi.spyOn(window, "confirm");

    expect(runGuard()).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("allows navigation when a registered component has unsaved changes and the user confirms", () => {
    const tracker = TestBed.inject(UnsavedChangesTracker);
    tracker.register({ hasUnsavedChanges: () => true });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    expect(runGuard()).toBe(true);
  });

  it("blocks navigation when a registered component has unsaved changes and the user declines", () => {
    const tracker = TestBed.inject(UnsavedChangesTracker);
    tracker.register({ hasUnsavedChanges: () => true });
    vi.spyOn(window, "confirm").mockReturnValue(false);

    expect(runGuard()).toBe(false);
  });

  it("ignores a component after it unregisters", () => {
    const tracker = TestBed.inject(UnsavedChangesTracker);
    const component: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => true,
    };
    tracker.register(component);
    tracker.unregister(component);
    const confirmSpy = vi.spyOn(window, "confirm");

    expect(runGuard()).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("keeps the current registrant when a stale one unregisters", () => {
    const tracker = TestBed.inject(UnsavedChangesTracker);
    const stale: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => false,
    };
    const current: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => true,
    };
    tracker.register(stale);
    tracker.register(current);
    tracker.unregister(stale);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    expect(runGuard()).toBe(true);
    expect(tracker.hasUnsavedChanges()).toBe(true);
  });
});
