import { describe, expect, it } from "vitest";

import { newGedcomRecord } from "./gedcomRecord";
import {
  newGedcomRepositoryLink,
  parseGedcomRepositoryLink,
  serializeGedcomRepositoryLink,
} from "./gedcomRepositoryLink";

describe("gedcomRepositoryLink", () => {
  it("parses multiple CALN tags into callNumbers", () => {
    const repositoryLink = parseGedcomRepositoryLink(
      newGedcomRecord({
        tag: "REPO",
        value: "@R1@",
        children: [
          newGedcomRecord({ tag: "CALN", value: "Call Number 1" }),
          newGedcomRecord({ tag: "CALN", value: "Call Number 2" }),
        ],
      }),
    );

    expect(repositoryLink.repositoryXref).toBe("@R1@");
    expect(repositoryLink.callNumbers).toEqual([
      "Call Number 1",
      "Call Number 2",
    ]);
  });

  it("parses a REPO with no CALN tags into an empty array", () => {
    const repositoryLink = parseGedcomRepositoryLink(
      newGedcomRecord({ tag: "REPO", value: "@R1@" }),
    );

    expect(repositoryLink.callNumbers).toEqual([]);
  });

  it("serializes multiple call numbers into separate CALN tags", () => {
    const record = serializeGedcomRepositoryLink(
      newGedcomRepositoryLink({
        repositoryXref: "@R1@",
        callNumbers: ["Call Number 1", "Call Number 2"],
      }),
    );

    expect(record.children).toEqual([
      newGedcomRecord({ tag: "CALN", value: "Call Number 1" }),
      newGedcomRecord({ tag: "CALN", value: "Call Number 2" }),
    ]);
  });

  it("omits empty call numbers when serializing", () => {
    const record = serializeGedcomRepositoryLink(
      newGedcomRepositoryLink({
        repositoryXref: "@R1@",
        callNumbers: [""],
      }),
    );

    expect(record.children).toEqual([]);
  });

  it("round-trips through parse and serialize", () => {
    const original = newGedcomRepositoryLink({
      repositoryXref: "@R1@",
      callNumbers: ["Call Number 1", "Call Number 2"],
    });

    const roundTripped = parseGedcomRepositoryLink(
      serializeGedcomRepositoryLink(original),
    );

    expect(roundTripped).toEqual(original);
  });
});
