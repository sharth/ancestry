import { inject, Injectable } from "@angular/core";
import type { CanDeactivateFn } from "@angular/router";

export interface ComponentWithUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// GedcomEditorDialogComponent registers itself here on creation (see its
// constructor) so this guard can ask about unsaved changes without every
// routed component needing its own viewChild/hasUnsavedChanges boilerplate
// to find and delegate to whichever dialog it happens to render.
@Injectable({ providedIn: "root" })
export class UnsavedChangesTracker {
  private readonly components = new Set<ComponentWithUnsavedChanges>();

  register(component: ComponentWithUnsavedChanges): void {
    this.components.add(component);
  }

  unregister(component: ComponentWithUnsavedChanges): void {
    this.components.delete(component);
  }

  hasUnsavedChanges(): boolean {
    return [...this.components].some((component) =>
      component.hasUnsavedChanges(),
    );
  }
}

export const confirmUnsavedChangesGuard: CanDeactivateFn<unknown> = () => {
  if (!inject(UnsavedChangesTracker).hasUnsavedChanges()) {
    return true;
  }
  return confirm("You have unsaved changes. Leave without saving?");
};
