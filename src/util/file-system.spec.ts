import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FileExistsError,
  copyFileToPath,
  getFileHandleAtPath,
  fileExistsAtPath,
  splitRelativePath,
} from "./file-system";

// An in-memory stand-in for a FileSystemDirectoryHandle: each entry is
// either file contents or a nested folder.
interface FakeFolder {
  [name: string]: FakeFolder | string | File;
}

function fakeDirectoryHandle(folder: FakeFolder): FileSystemDirectoryHandle {
  const notFound = () => Promise.reject(new DOMException("", "NotFoundError"));
  return {
    keys: () => Object.keys(folder).values(),
    getDirectoryHandle: (name: string, options?: { create?: boolean }) => {
      if (!(name in folder)) {
        if (!options?.create) {
          return notFound();
        }
        folder[name] = {};
      }
      const entry = folder[name];
      return typeof entry === "object" && !(entry instanceof File)
        ? Promise.resolve(fakeDirectoryHandle(entry))
        : notFound();
    },
    getFileHandle: (name: string, options?: { create?: boolean }) => {
      if (!(name in folder) && !options?.create) {
        return notFound();
      }
      return Promise.resolve({
        name,
        createWritable: () =>
          Promise.resolve({
            write: (data: File) => {
              folder[name] = data;
              return Promise.resolve();
            },
            close: () => Promise.resolve(),
          }),
      });
    },
  } as unknown as FileSystemDirectoryHandle;
}

describe("splitRelativePath", () => {
  it("splits on either slash and drops empty parts", () => {
    expect(splitRelativePath("media\\1901/O12 Census.png")).toEqual([
      "media",
      "1901",
      "O12 Census.png",
    ]);
    expect(splitRelativePath("/a//b/")).toEqual(["a", "b"]);
    expect(splitRelativePath("")).toEqual([]);
  });
});

describe("files in a folder", () => {
  let folder: FakeFolder;
  let directoryHandle: FileSystemDirectoryHandle;

  beforeEach(() => {
    folder = { "O1 Deed.png": "existing", media: { "O3 Map.jpg": "map" } };
    directoryHandle = fakeDirectoryHandle(folder);
  });

  it("resolves a file handle, including in a subfolder", async () => {
    await expect(
      getFileHandleAtPath(directoryHandle, "media\\O3 Map.jpg"),
    ).resolves.toMatchObject({ name: "O3 Map.jpg" });
  });

  it("resolves nothing for a missing file or an empty path", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      getFileHandleAtPath(directoryHandle, "missing/O3 Map.jpg"),
    ).resolves.toBeUndefined();
    await expect(
      getFileHandleAtPath(directoryHandle, ""),
    ).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });

  it("reports whether a file exists", async () => {
    await expect(
      fileExistsAtPath(directoryHandle, "O1 Deed.png"),
    ).resolves.toBe(true);
    await expect(
      fileExistsAtPath(directoryHandle, "media/O3 Map.jpg"),
    ).resolves.toBe(true);
    await expect(
      fileExistsAtPath(directoryHandle, "O2 Will.png"),
    ).resolves.toBe(false);
    await expect(
      fileExistsAtPath(directoryHandle, "missing/O3 Map.jpg"),
    ).resolves.toBe(false);
  });

  it("copies a file under the given name, creating folders", async () => {
    const file = new File(["png"], "scan.png");
    await copyFileToPath(directoryHandle, file, "O2 Will.png");
    await copyFileToPath(directoryHandle, file, "wills/O4 Will.png");
    expect(folder["O2 Will.png"]).toBe(file);
    expect(folder["wills"]).toEqual({ "O4 Will.png": file });
  });

  it("refuses to overwrite an existing file", async () => {
    const file = new File(["png"], "scan.png");
    await expect(
      copyFileToPath(directoryHandle, file, "O1 Deed.png"),
    ).rejects.toBeInstanceOf(FileExistsError);
    expect(folder["O1 Deed.png"]).toBe("existing");
  });
});
