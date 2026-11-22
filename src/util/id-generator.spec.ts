import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";

import { IdGenerator } from "./id-generator";

describe("IdGenerator", () => {
  it("counts up separately for each prefix", () => {
    const idGenerator = TestBed.inject(IdGenerator);

    expect(idGenerator.getId("individual")).toBe("individual-1");
    expect(idGenerator.getId("individual")).toBe("individual-2");
    expect(idGenerator.getId("source")).toBe("source-1");
  });
});
