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
                  matcher: (segments) => ({ consumed: segments }),
                  component: TestLeafComponent,
                  resolve: {
                    path: (route: ActivatedRouteSnapshot) =>
                      route.url.map((segment) => segment.path.toLowerCase()),
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

  it("resolves every matched segment, lowercased, into the leaf component's path input", async () => {
    const router = configure();
    await router.navigateByUrl("/place/United-States/Maryland/Cecil-County");

    const route = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(route?.data["path"]).toEqual([
      "united-states",
      "maryland",
      "cecil-county",
    ]);
  });

  it("matches with no further segments", async () => {
    const router = configure();
    await router.navigateByUrl("/place");

    const route = router.routerState.snapshot.root.firstChild?.firstChild;
    expect(route?.data["path"]).toEqual([]);
  });
});
