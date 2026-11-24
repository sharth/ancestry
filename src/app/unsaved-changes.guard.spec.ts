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
  // The guard only reads the component, so empty fakes stand in for the router snapshots.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-class-instance-assignment
  const currentRoute = {} as ActivatedRouteSnapshot;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-class-instance-assignment
  const currentState = {} as RouterStateSnapshot;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-class-instance-assignment
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
