// Multimedia files within the data folder, addressed by the relative paths
// stored in GEDCOM OBJE.FILE values (forward or backward slashes).

export class MultimediaFileExistsError extends Error {
  constructor(readonly fileName: string) {
    super(`"${fileName}" already exists in the data folder`);
    this.name = "MultimediaFileExistsError";
  }
}

// Splits a multimedia path into its non-empty parts.
export function splitMultimediaPath(relativePath: string): string[] {
  return relativePath.split(/[/\\]/).filter((part) => part.length > 0);
}

async function directoryHasEntry(
  directoryHandle: FileSystemDirectoryHandle,
  name: string,
): Promise<boolean> {
  for await (const entryName of directoryHandle.keys()) {
    if (entryName === name) {
      return true;
    }
  }
  return false;
}

// Resolves a multimedia path to a file handle within `directoryHandle`.
// Returns undefined if the path doesn't resolve to a file within it.
export async function getMultimediaFileHandle(
  directoryHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<FileSystemFileHandle | undefined> {
  const pathParts = splitMultimediaPath(relativePath);
  const fileName = pathParts.pop();
  if (fileName === undefined) {
    return undefined;
  }

  try {
    for (const part of pathParts) {
      directoryHandle = await directoryHandle.getDirectoryHandle(part);
    }
    return await directoryHandle.getFileHandle(fileName);
  } catch (error) {
    console.error(`Failed to resolve multimedia file ${relativePath}:`, error);
    return undefined;
  }
}

// Whether something already exists at `relativePath` in `directoryHandle`.
// Unlike getMultimediaFileHandle, a missing file or folder is an ordinary
// answer here, not an error.
export async function multimediaFileExists(
  directoryHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<boolean> {
  const pathParts = splitMultimediaPath(relativePath);
  const fileName = pathParts.pop();
  if (fileName === undefined) {
    return false;
  }
  for (const part of pathParts) {
    if (!(await directoryHasEntry(directoryHandle, part))) {
      return false;
    }
    directoryHandle = await directoryHandle.getDirectoryHandle(part);
  }
  return directoryHasEntry(directoryHandle, fileName);
}

// Copies a file (typically one picked from outside the data folder) to
// `relativePath` in `directoryHandle`, creating folders on the way as
// needed. Throws MultimediaFileExistsError rather than overwrite something
// already there. Needs write access to the directory.
export async function copyMultimediaFile(
  directoryHandle: FileSystemDirectoryHandle,
  file: File,
  relativePath: string,
): Promise<void> {
  if (await multimediaFileExists(directoryHandle, relativePath)) {
    throw new MultimediaFileExistsError(relativePath);
  }

  const pathParts = splitMultimediaPath(relativePath);
  const fileName = pathParts.pop();
  if (fileName === undefined) {
    throw new Error("Empty file path");
  }
  for (const part of pathParts) {
    directoryHandle = await directoryHandle.getDirectoryHandle(part, {
      create: true,
    });
  }
  const fileHandle = await directoryHandle.getFileHandle(fileName, {
    create: true,
  });
  const writableStream = await fileHandle.createWritable();
  await writableStream.write(file);
  await writableStream.close();
}
