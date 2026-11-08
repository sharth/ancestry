// Builds the file name a newly added multimedia file is given when it's
// copied into the data folder: "<xref> <title>.<ext>", keeping the original
// file's extension. Characters that aren't allowed in file names on common
// file systems are dropped, so the result is safe to create on Windows,
// macOS, and Linux.
export function multimediaFileName(
  xref: string,
  title: string,
  originalFileName: string,
): string {
  const dot = originalFileName.lastIndexOf(".");
  const extension = dot > 0 ? originalFileName.slice(dot) : "";
  const stem = [xref, title]
    .map((part) =>
      part
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((part) => part.length > 0)
    .join(" ")
    // Windows doesn't allow a name to end with a dot or a space.
    .replace(/[. ]+$/, "");
  return `${stem || "multimedia"}${extension.toLowerCase()}`;
}

// Returns `fileName` if it isn't in `takenNames`, otherwise the first of
// "<stem> (2).<ext>", "<stem> (3).<ext>", ... that isn't.
export function uniqueFileName(
  fileName: string,
  takenNames: ReadonlySet<string>,
): string {
  if (!takenNames.has(fileName)) {
    return fileName;
  }
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot) : "";
  for (let n = 2; ; n++) {
    const candidate = `${stem} (${n})${extension}`;
    if (!takenNames.has(candidate)) {
      return candidate;
    }
  }
}
