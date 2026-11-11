// Builds the file name a newly added multimedia file is given when it's
// copied into the data folder: "<xref> <title>.<ext>" (e.g. "O12 1901
// Census.png"), keeping the original
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
  // The xref is stored with its GEDCOM @ delimiters ("@O12@"); the file
  // name uses the bare id ("O12").
  const id = xref.replace(/^@(.*)@$/, "$1");
  const stem = sanitizeFileName([id, title].join(" "));
  return `${stem || "multimedia"}${extension.toLowerCase()}`;
}

// Drops characters that aren't allowed in file names on common file systems
// (and control characters), collapses whitespace, and trims leading/trailing
// spaces and trailing dots, which Windows doesn't allow. May return "".
export function sanitizeFileName(fileName: string): string {
  return (
    fileName
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/, "")
  );
}

// Why `filePath` can't be used as the path to copy a multimedia file to, or
// undefined if it can. Each folder and file name in it must already be
// sanitized (see sanitizeFileName).
export function multimediaFilePathProblem(
  filePath: string,
): string | undefined {
  const parts = filePath.split(/[/\\]/);
  if (parts.some((part) => part.length === 0)) {
    return "Enter a file name.";
  }
  if (parts.some((part) => part !== sanitizeFileName(part))) {
    return "File names can't contain < > : \" | ? * or end with a dot or space.";
  }
  return undefined;
}
