import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmUnsavedChangesGuard,
  type ComponentWithUnsavedChanges,
} from "./unsaved-changes.guard";

describe("confirmUnsavedChangesGuard", () => {
  const currentRoute = {} as ActivatedRouteSnapshot;
  const currentState = {} as RouterStateSnapshot;
  const nextState = {} as RouterStateSnapshot;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows navigation without prompting when there are no unsaved changes", () => {
    const component: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => false,
    };
    const confirmSpy = vi.spyOn(window, "confirm");

    const result = confirmUnsavedChangesGuard(
      component,
      currentRoute,
      currentState,
      nextState,
    );

    expect(result).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("allows navigation when there are unsaved changes and the user confirms", () => {
    const component: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => true,
    };
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const result = confirmUnsavedChangesGuard(
      component,
      currentRoute,
      currentState,
      nextState,
    );

    expect(result).toBe(true);
  });

  it("blocks navigation when there are unsaved changes and the user declines", () => {
    const component: ComponentWithUnsavedChanges = {
      hasUnsavedChanges: () => true,
    };
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const result = confirmUnsavedChangesGuard(
      component,
      currentRoute,
      currentState,
      nextState,
    );

    expect(result).toBe(false);
  });
});
