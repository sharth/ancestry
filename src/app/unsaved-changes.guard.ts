import { inject, Injectable } from "@angular/core";
import type { CanDeactivateFn } from "@angular/router";

export interface ComponentWithUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// GedcomEditorDialogComponent registers itself here on creation (see its
// constructor) so this guard can ask about unsaved changes without every
// routed component needing its own viewChild/hasUnsavedChanges boilerplate
// to find and delegate to whichever dialog it happens to render. A guard
// runs in the router's environment injector, which has no visibility into
// the element-injector tree a rendered component lives in, so there's no
// inject()-only way to reach "the dialog currently on screen" directly.
@Injectable({ providedIn: "root" })
export class UnsavedChangesTracker {
  private component?: ComponentWithUnsavedChanges;

  register(component: ComponentWithUnsavedChanges): void {
    this.component = component;
  }

  unregister(component: ComponentWithUnsavedChanges): void {
    if (this.component === component) {
      this.component = undefined;
    }
  }

  hasUnsavedChanges(): boolean {
    return this.component?.hasUnsavedChanges() ?? false;
  }
}

export const confirmUnsavedChangesGuard: CanDeactivateFn<unknown> = () => {
  if (!inject(UnsavedChangesTracker).hasUnsavedChanges()) {
    return true;
  }
  return confirm("You have unsaved changes. Leave without saving?");
};
