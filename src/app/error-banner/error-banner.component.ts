import { Component, inject, signal } from "@angular/core";

import { ErrorReporter, type ReportedError } from "./error-reporter";

@Component({
  selector: "app-error-banner",
  templateUrl: "./error-banner.component.html",
  styleUrl: "./error-banner.component.css",
})
export class ErrorBannerComponent {
  readonly errorReporter = inject(ErrorReporter);

  /** The error whose details were just copied, to show "Copied". */
  readonly copied = signal<ReportedError | null>(null);

  async copy(error: ReportedError) {
    await navigator.clipboard.writeText(error.details);
    this.copied.set(error);
  }
}
