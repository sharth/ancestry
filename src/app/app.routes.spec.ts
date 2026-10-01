import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  Router,
  UrlSegment,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { describe, expect, it } from "vitest";

import { placePathMatcher } from "./app.routes";

describe("placePathMatcher", () => {
  it("joins every remaining segment into a single path param", () => {
    const segments = [
      new UrlSegment("united-states", {}),
      new UrlSegment("maryland", {}),
      new UrlSegment("cecil-county", {}),
    ];

    const result = placePathMatcher(segments, {} as never, {});

    expect(result?.consumed).toBe(segments);
    expect(result?.posParams?.["path"]?.path).toBe(
      "united-states/maryland/cecil-county",
    );
  });

  it("does not match when there are no segments", () => {
    expect(placePathMatcher([], {} as never, {})).toBeNull();
  });
});

@Component({ selector: "app-test-leaf", template: "{{ path() }}" })
class TestLeafComponent {
  readonly path = input.required<string>();
}

describe("place route wiring", () => {
  it("joins every matched segment into the leaf component's path input", async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: "place",
              children: [
                { matcher: placePathMatcher, component: TestLeafComponent },
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
    expect(route?.params["path"]).toBe("united-states/maryland/cecil-county");
  });
});
