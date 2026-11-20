import { ErrorHandler, Injectable, inject, signal } from "@angular/core";

export interface ReportedError {
  readonly message: string;
  readonly details: string;
  /** How many times this same error has been reported. */
  readonly count: number;
}

/** Holds the uncaught errors that haven't been dismissed yet, for the error banner. */
@Injectable({ providedIn: "root" })
export class ErrorReporter {
  private readonly _errors = signal<readonly ReportedError[]>([]);
  readonly errors = this._errors.asReadonly();

  report(error: unknown) {
    const message = errorMessage(error);
    const details = errorDetails(error);
    this._errors.update((errors) => {
      // An error thrown from an effect or template can repeat on every
      // render, so count repeats instead of stacking identical banners.
      const index = errors.findIndex(
        (e) => e.message === message && e.details === details,
      );
      if (index === -1) {
        return [...errors, { message, details, count: 1 }];
      }
      return errors.map((e, i) =>
        i === index ? { ...e, count: e.count + 1 } : e,
      );
    });
  }

  dismiss(error: ReportedError) {
    this._errors.update((errors) => errors.filter((e) => e !== error));
  }
}

/**
 * Angular's ErrorHandler receives every uncaught error: from templates,
 * effects, event listeners, and (with provideBrowserGlobalErrorListeners)
 * the window's error and unhandledrejection events. This one still logs to
 * the console, and also shows the error to the user.
 */
@Injectable()
export class ReportingErrorHandler extends ErrorHandler {
  private readonly errorReporter = inject(ErrorReporter);

  override handleError(error: unknown) {
    super.handleError(error);
    this.errorReporter.report(error);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error);
}

function errorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  if (typeof error !== "object" || error === null) {
    return String(error);
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    // e.g. a circular structure.
    return Object.prototype.toString.call(error);
  }
}
