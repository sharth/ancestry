import { describe, expect, it } from "vitest";

import { newGedcomChangeDate } from "./gedcomChangeDate";
import { newGedcomDatabase, stampChangeDates } from "./gedcomDatabase";
import {
  newGedcomIndividual,
  serializeGedcomIndividual,
} from "./gedcomIndividual";
import { newGedcomName } from "./gedcomName";
import { parseGedcomRecords } from "./gedcomRecord";
import { newGedcomSource, serializeGedcomSource } from "./gedcomSource";

const TODAY = "9 OCT 2026";

describe("stampChangeDates", () => {
  it("stamps a newly created record that has no original", () => {
    const database = newGedcomDatabase({
      individuals: { "@I1@": newGedcomIndividual({ xref: "@I1@" }) },
    });

    const stamped = stampChangeDates([], database, TODAY);

    expect(stamped.individuals["@I1@"]?.changeDate).toEqual(
      newGedcomChangeDate({ value: TODAY }),
    );
  });

  it("stamps a record whose content differs from the original", () => {
    const originalGedcomRecords = parseGedcomRecords(
      ["0 @I1@ INDI", "1 NAME John /Doe/", "1 CHAN", "2 DATE 1 JAN 2000"].join(
        "\n",
      ),
    );
    const database = newGedcomDatabase({
      individuals: {
        "@I1@": newGedcomIndividual({
          xref: "@I1@",
          changeDate: newGedcomChangeDate({ value: "1 JAN 2000" }),
          names: [newGedcomName({ givenName: "Jane", surname: "Doe" })],
        }),
      },
    });

    const stamped = stampChangeDates(originalGedcomRecords, database, TODAY);

    expect(stamped.individuals["@I1@"]?.changeDate).toEqual(
      newGedcomChangeDate({ value: TODAY }),
    );
  });

  it("leaves a record's change date alone when nothing changed", () => {
    const individual = newGedcomIndividual({
      xref: "@I1@",
      changeDate: newGedcomChangeDate({ value: "1 JAN 2000" }),
      names: [newGedcomName({ givenName: "John", surname: "Doe" })],
    });
    const originalGedcomRecords = [serializeGedcomIndividual(individual)];
    const database = newGedcomDatabase({ individuals: { "@I1@": individual } });

    const stamped = stampChangeDates(originalGedcomRecords, database, TODAY);

    expect(stamped.individuals["@I1@"]?.changeDate).toEqual(
      newGedcomChangeDate({ value: "1 JAN 2000" }),
    );
  });

  it("doesn't count a stale CHAN by itself as a content change", () => {
    const source = newGedcomSource({
      xref: "@S1@",
      title: "Title",
      changeDate: newGedcomChangeDate({ value: "1 JAN 2000" }),
    });
    // The original record on disk carries an older CHAN than the one on
    // `source` above -- simulating a change date that's gone stale for
    // some other reason, which by itself shouldn't look like a content
    // change and re-stamp.
    const originalGedcomRecords = [
      serializeGedcomSource({
        ...source,
        changeDate: newGedcomChangeDate({ value: "1 JAN 1999" }),
      }),
    ];
    const database = newGedcomDatabase({ sources: { "@S1@": source } });

    const stamped = stampChangeDates(originalGedcomRecords, database, TODAY);

    expect(stamped.sources["@S1@"]?.changeDate).toEqual(
      newGedcomChangeDate({ value: "1 JAN 2000" }),
    );
  });
});
