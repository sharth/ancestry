import type { CanDeactivateFn } from "@angular/router";

export interface ComponentWithUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const confirmUnsavedChangesGuard: CanDeactivateFn<
  ComponentWithUnsavedChanges
> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return confirm("You have unsaved changes. Leave without saving?");
};
