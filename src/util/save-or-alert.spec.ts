import { describe, expect, it, vi } from "vitest";

import { saveOrAlert } from "./save-or-alert";

describe("saveOrAlert", () => {
  it("returns true when the save succeeds", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockReturnValue(undefined);

    expect(await saveOrAlert(() => Promise.resolve())).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("alerts and returns false when the save fails", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockReturnValue(undefined);
    vi.spyOn(console, "error").mockReturnValue(undefined);

    expect(
      await saveOrAlert(() => Promise.reject(new Error("disk full"))),
    ).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith("Couldn't save: disk full");
  });
});
