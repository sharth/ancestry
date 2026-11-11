import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MultimediaFileExistsError,
  copyMultimediaFile,
  getMultimediaFileHandle,
  multimediaFileExists,
  splitMultimediaPath,
} from "./multimedia-files";

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

describe("splitMultimediaPath", () => {
  it("splits on either slash and drops empty parts", () => {
    expect(splitMultimediaPath("media\\1901/O12 Census.png")).toEqual([
      "media",
      "1901",
      "O12 Census.png",
    ]);
    expect(splitMultimediaPath("/a//b/")).toEqual(["a", "b"]);
    expect(splitMultimediaPath("")).toEqual([]);
  });
});

describe("multimedia files in a folder", () => {
  let folder: FakeFolder;
  let directoryHandle: FileSystemDirectoryHandle;

  beforeEach(() => {
    folder = { "O1 Deed.png": "existing", media: { "O3 Map.jpg": "map" } };
    directoryHandle = fakeDirectoryHandle(folder);
  });

  it("resolves a file handle, including in a subfolder", async () => {
    await expect(
      getMultimediaFileHandle(directoryHandle, "media\\O3 Map.jpg"),
    ).resolves.toMatchObject({ name: "O3 Map.jpg" });
  });

  it("resolves nothing for a missing file or an empty path", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      getMultimediaFileHandle(directoryHandle, "missing/O3 Map.jpg"),
    ).resolves.toBeUndefined();
    await expect(
      getMultimediaFileHandle(directoryHandle, ""),
    ).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });

  it("reports whether a file exists", async () => {
    await expect(
      multimediaFileExists(directoryHandle, "O1 Deed.png"),
    ).resolves.toBe(true);
    await expect(
      multimediaFileExists(directoryHandle, "media/O3 Map.jpg"),
    ).resolves.toBe(true);
    await expect(
      multimediaFileExists(directoryHandle, "O2 Will.png"),
    ).resolves.toBe(false);
    await expect(
      multimediaFileExists(directoryHandle, "missing/O3 Map.jpg"),
    ).resolves.toBe(false);
  });

  it("copies a file under the given name, creating folders", async () => {
    const file = new File(["png"], "scan.png");
    await copyMultimediaFile(directoryHandle, file, "O2 Will.png");
    await copyMultimediaFile(directoryHandle, file, "wills/O4 Will.png");
    expect(folder["O2 Will.png"]).toBe(file);
    expect(folder["wills"]).toEqual({ "O4 Will.png": file });
  });

  it("refuses to overwrite an existing file", async () => {
    const file = new File(["png"], "scan.png");
    await expect(
      copyMultimediaFile(directoryHandle, file, "O1 Deed.png"),
    ).rejects.toBeInstanceOf(MultimediaFileExistsError);
    expect(folder["O1 Deed.png"]).toBe("existing");
  });
});
