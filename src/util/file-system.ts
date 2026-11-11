// File operations within a directory handle, addressing files by relative
// paths that use forward or backward slashes.

export class FileExistsError extends Error {
  constructor(readonly fileName: string) {
    super(`"${fileName}" already exists`);
    this.name = "FileExistsError";
  }
}

// Splits a relative path into its non-empty parts.
export function splitRelativePath(relativePath: string): string[] {
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

// Resolves a relative path to a file handle within `directoryHandle`.
// Returns undefined if the path doesn't resolve to a file within it.
export async function getFileHandleAtPath(
  directoryHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<FileSystemFileHandle | undefined> {
  const pathParts = splitRelativePath(relativePath);
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
    console.error(`Failed to resolve file ${relativePath}:`, error);
    return undefined;
  }
}

// Whether something already exists at `relativePath` in `directoryHandle`.
// Unlike getFileHandleAtPath, a missing file or folder is an ordinary
// answer here, not an error.
export async function fileExistsAtPath(
  directoryHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<boolean> {
  const pathParts = splitRelativePath(relativePath);
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

// Copies a file to
// `relativePath` in `directoryHandle`, creating folders on the way as
// needed. Throws FileExistsError rather than overwrite something
// already there. Needs write access to the directory.
export async function copyFileToPath(
  directoryHandle: FileSystemDirectoryHandle,
  file: File,
  relativePath: string,
): Promise<void> {
  if (await fileExistsAtPath(directoryHandle, relativePath)) {
    throw new FileExistsError(relativePath);
  }

  const pathParts = splitRelativePath(relativePath);
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
