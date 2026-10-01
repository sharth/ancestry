import { Component, input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ActivatedRouteSnapshot } from "@angular/router";
import {
  Router,
  provideRouter,
  withComponentInputBinding,
} from "@angular/router";
import { describe, expect, it } from "vitest";

@Component({ selector: "app-test-leaf", template: "{{ path().join('/') }}" })
class TestLeafComponent {
  readonly path = input.required<string[]>();
}

describe("a matcher + resolver route like place/...", () => {
  function configure() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            {
              path: "place",
              children: [
                {
                  matcher: (segments) =>
                    segments.length === 0 ? null : { consumed: segments },
                  component: TestLeafComponent,
                  resolve: {
                    path: (route: ActivatedRouteSnapshot) =>
                      route.url.map((segment) => segment.path),
                  },
                },
              ],
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    return TestBed.inject(Router);
  }

  it("resolves every matched segment into the leaf component's path input", async () => {
    const router = configure();
    await router.navigateByUrl("/place/united-states/maryland/cecil-county");

    const route = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(route?.data["path"]).toEqual([
      "united-states",
      "maryland",
      "cecil-county",
    ]);
  });

  it("does not match with no further segments", async () => {
    const router = configure();
    await router.navigateByUrl("/place");

    expect(router.routerState.snapshot.root.firstChild?.firstChild).toBeFalsy();
  });
});
