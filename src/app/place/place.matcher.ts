import { UrlSegment, type UrlMatcher } from "@angular/router";

/** Matches any number of remaining segments under `place/`, joining them
 * into a single `path` param (e.g. "united-states/maryland") so a region at
 * any depth of the place hierarchy gets its own URL. */
export const placePathMatcher: UrlMatcher = (segments) => {
  if (segments.length === 0) return null;
  return {
    consumed: segments,
    posParams: {
      path: new UrlSegment(
        segments.map((segment) => segment.path).join("/"),
        {},
      ),
    },
  };
};
