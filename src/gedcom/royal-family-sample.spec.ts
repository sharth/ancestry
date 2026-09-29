import { describe, expect, it } from "vitest";
import { parseGedcomDatabase } from "./gedcomDatabase";
import { parseGedcomRecords } from "./gedcomRecord";

// The bundled "Example Data" source on the settings page (see
// BUILTIN_GEDCOM_URL in ancestry.service.ts) is a real-world export that
// previously had ~600 dangling FAM<->INDI cross references (e.g. a FAM's
// CHIL pointing at an INDI xref that didn't exist in the file, or an INDI's
// FAMS pointing at a FAM that didn't list it as HUSB/WIFE). parseGedcomDatabase
// treats that as a hard error, which surfaced as the settings page never
// being able to redirect into the rest of the app after choosing the
// example data. This guards against the sample regressing.
describe("bundled royal-family.ged sample", () => {
  it("parses without a referential-integrity error", async () => {
    const response = await fetch("assets/samples/royal-family.ged");
    const text = await response.text();
    const records = parseGedcomRecords(text);

    expect(() => parseGedcomDatabase(records)).not.toThrow();
  });
});
