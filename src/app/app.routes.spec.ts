import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  Router,
  UrlSegment,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { describe, expect, it } from "vitest";

import { placePathMatcher, placePathResolver } from "./app.routes";

describe("placePathMatcher", () => {
  it("consumes every remaining segment", () => {
    const segments = [
      new UrlSegment("united-states", {}),
      new UrlSegment("maryland", {}),
      new UrlSegment("cecil-county", {}),
    ];

    const result = placePathMatcher(segments, {} as never, {});

    expect(result?.consumed).toBe(segments);
  });

  it("does not match when there are no segments", () => {
    expect(placePathMatcher([], {} as never, {})).toBeNull();
  });
});

@Component({ selector: "app-test-leaf", template: "{{ path().join('/') }}" })
class TestLeafComponent {
  readonly path = input.required<string[]>();
}

describe("place route wiring", () => {
  it("resolves every matched segment into the leaf component's path input", async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: "place",
              children: [
                {
                  matcher: placePathMatcher,
                  component: TestLeafComponent,
                  resolve: { path: placePathResolver },
                },
              ],
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });

    const router = TestBed.inject(Router);
    await router.navigateByUrl("/place/united-states/maryland/cecil-county");

    const route = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(route?.data["path"]).toEqual([
      "united-states",
      "maryland",
      "cecil-county",
    ]);
  });
});
