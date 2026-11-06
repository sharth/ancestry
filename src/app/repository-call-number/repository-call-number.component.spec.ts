import { inputBinding, signal } from "@angular/core";
import { render, screen } from "@testing-library/angular/zoneless";
import { describe, expect, it } from "vitest";

import { RepositoryCallNumberComponent } from "./repository-call-number.component";

async function renderCallNumber(callNumber: string) {
  await render(RepositoryCallNumberComponent, {
    bindings: [inputBinding("callNumber", signal(callNumber))],
    waitForStableOnRender: true,
  });
}

describe("RepositoryCallNumberComponent", () => {
  it("renders a URL call number as a link opening in a new tab", async () => {
    const url = "https://www.familysearch.org/ark:/61903/1:1:ABCD";
    await renderCallNumber(url);
    const link = screen.getByRole("link", { name: url });
    expect(link.getAttribute("href")).toBe(url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    expect(link.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("doesn't link a non-http scheme", async () => {
    await renderCallNumber("javascript:alert(1)");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("doesn't link a URL with a username or password", async () => {
    await renderCallNumber("https://www.familysearch.org@evil.example/");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a plain call number as text", async () => {
    await renderCallNumber("Film 12345");
    expect(screen.getByText("Film 12345")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("doesn't link a call number with a URL embedded in other text", async () => {
    await renderCallNumber("See https://example.com/record for details");
    expect(screen.queryByRole("link")).toBeNull();
  });
});
