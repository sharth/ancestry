import { computed, effect, inject, type Signal } from "@angular/core";
import { DomSanitizer, type SafeResourceUrl } from "@angular/platform-browser";

// An object URL for whatever file `file` currently holds, for an <img> or
// <iframe> to show. Each URL is revoked once the file changes or the
// component is destroyed. Must be called in an injection context.
export function fileObjectUrl(
  file: () => Blob | undefined,
): Signal<SafeResourceUrl | undefined> {
  const sanitizer = inject(DomSanitizer);
  const objectUrl = computed(() => {
    const blob = file();
    return blob ? URL.createObjectURL(blob) : undefined;
  });
  effect((onCleanup) => {
    const url = objectUrl();
    onCleanup(() => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
  });
  return computed(() => {
    const url = objectUrl();
    return url ? sanitizer.bypassSecurityTrustResourceUrl(url) : undefined;
  });
}
