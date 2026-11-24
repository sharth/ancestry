import { ErrorHandler } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorReporter, ReportingErrorHandler } from "./error-reporter";

describe("ReportingErrorHandler", () => {
  let errorHandler: ErrorHandler;
  let errorReporter: ErrorReporter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: ReportingErrorHandler }],
    });
    errorHandler = TestBed.inject(ErrorHandler);
    errorReporter = TestBed.inject(ErrorReporter);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("logs to the console and reports the error", () => {
    const error = new Error("boom");
    errorHandler.handleError(error);

    expect(console.error).toHaveBeenCalled();
    expect(errorReporter.errors()).toEqual([
      { message: "boom", details: error.stack, count: 1 },
    ]);
  });

  it("reports values that aren't Errors", () => {
    errorHandler.handleError("plain string");

    expect(errorReporter.errors()).toEqual([
      { message: "plain string", details: "plain string", count: 1 },
    ]);
  });

  it("counts repeats of the same error", () => {
    const error = new Error("boom");
    errorHandler.handleError(error);
    errorHandler.handleError(error);

    expect(errorReporter.errors()).toEqual([
      { message: "boom", details: error.stack, count: 2 },
    ]);
  });

  it("dismisses an error", () => {
    errorHandler.handleError(new Error("one"));
    errorHandler.handleError(new Error("two"));
    const [first] = errorReporter.errors();
    assert(first);
    errorReporter.dismiss(first);

    expect(errorReporter.errors().map((e) => e.message)).toEqual(["two"]);
  });
});
