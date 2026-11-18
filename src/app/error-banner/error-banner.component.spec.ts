import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { render, screen } from "@testing-library/angular/zoneless";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBannerComponent } from "./error-banner.component";
import { ErrorReporter } from "./error-reporter";

describe("ErrorBannerComponent", () => {
  let errorReporter: ErrorReporter;
  let fixture: ComponentFixture<ErrorBannerComponent>;

  beforeEach(async () => {
    ({ fixture } = await render(ErrorBannerComponent, {
      waitForStableOnRender: true,
    }));
    errorReporter = TestBed.inject(ErrorReporter);
  });

  it("shows nothing without errors", () => {
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a reported error with its details", async () => {
    errorReporter.report(new Error("boom"));
    await fixture.whenStable();

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("boom");
    expect(alert.querySelector("pre")?.textContent).toContain("Error: boom");
  });

  it("dismisses an error", async () => {
    errorReporter.report(new Error("boom"));
    await fixture.whenStable();

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await fixture.whenStable();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(errorReporter.errors()).toEqual([]);
  });

  it("copies the details", async () => {
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const error = new Error("boom");
    errorReporter.report(error);
    await fixture.whenStable();

    await userEvent.click(screen.getByText("Details"));
    await userEvent.click(screen.getByRole("button", { name: /Copy/ }));
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledWith(error.stack);
    expect(screen.getByRole("button", { name: /Copied/ })).toBeTruthy();
  });
});
