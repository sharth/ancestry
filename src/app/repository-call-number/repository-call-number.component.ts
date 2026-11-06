import { Component, computed, input } from "@angular/core";

import { extractUrls } from "../validation/source-url.util";

/** A repository call number (CALN). Rendered as a link when the whole call
 * number is an http(s) URL, and as plain text otherwise. The URL comes from
 * the GEDCOM file, so it's treated as semi-untrusted: only http/https
 * schemes without a username or password are linked, it opens in a new tab with no opener or referrer, and
 * it's marked nofollow. */
@Component({
  selector: "app-repository-call-number",
  template: `
    @if (url(); as url) {
      <a
        [href]="url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        referrerpolicy="no-referrer"
        >{{ callNumber() }}</a
      >
    } @else {
      <span>{{ callNumber() }}</span>
    }
  `,
})
export class RepositoryCallNumberComponent {
  readonly callNumber = input.required<string>();

  readonly url = computed(() => {
    const urls = extractUrls(this.callNumber());
    const url = urls.length === 1 && urls[0]?.standalone ? urls[0].url : "";
    // URL.parse returns null for anything that isn't a well-formed URL.
    const parsed = URL.parse(url);
    if (parsed?.protocol !== "http:" && parsed?.protocol !== "https:") {
      return undefined;
    }
    // A username or password can disguise the real host, e.g.
    // "https://www.familysearch.org@evil.example/" goes to evil.example.
    if (parsed.username !== "" || parsed.password !== "") {
      return undefined;
    }
    return parsed.href;
  });
}
