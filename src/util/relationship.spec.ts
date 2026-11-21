import { describe, expect, it } from "vitest";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../gedcom/gedcomDatabase";
import { newGedcomFamily } from "../gedcom/gedcomFamily";
import { newGedcomIndividual } from "../gedcom/gedcomIndividual";
import { newGedcomSex } from "../gedcom/gedcomSex";
import { describeRelationship, relationshipName } from "./relationship";

// Builds a database from families given as [xref, husband, wife, children].
// An individual's sex is the first letter of its xref (M, F, or U for
// unknown), and its family links are filled in from the families.
function buildDatabase(
  families: [string, string, string, string[]][],
): GedcomDatabase {
  const gedcomDatabase = newGedcomDatabase();
  const individual = (xref: string) => {
    const existing = gedcomDatabase.individuals[xref];
    if (existing) return existing;
    const sex = xref.charAt(1);
    const created = newGedcomIndividual({
      xref,
      sex: newGedcomSex({ sex: sex === "U" ? "" : sex }),
    });
    gedcomDatabase.individuals[xref] = created;
    return created;
  };
  for (const [xref, husbandXref, wifeXref, childXrefs] of families) {
    gedcomDatabase.families[xref] = newGedcomFamily({
      xref,
      husbandXref,
      wifeXref,
      childXrefs,
    });
    for (const parentXref of [husbandXref, wifeXref]) {
      if (parentXref) individual(parentXref).parentOfFamilyXrefs.push(xref);
    }
    for (const childXref of childXrefs) {
      individual(childXref).childOfFamilyXrefs.push(xref);
    }
  }
  return gedcomDatabase;
}

// Grandparents @MGF@ + @FGM@ have @MDAD@ and @FAUNT@. @MDAD@ + @FMOM@ have
// the root @MROOT@ and @FSIS@. @FAUNT@ + @MUNCLEINLAW@ have @MCOUSIN@, whose
// child is @FCOUSINKID@. @FSIS@ has @MNEPHEW@. @MROOT@ + @FWIFE@ have
// @UKID@, whose child is @MGRANDSON@. @MDAD@ + @FSTEPMOM@ have @MHALFBRO@.
const family = buildDatabase([
  ["@F1@", "@MGF@", "@FGM@", ["@MDAD@", "@FAUNT@"]],
  ["@F2@", "@MDAD@", "@FMOM@", ["@MROOT@", "@FSIS@"]],
  ["@F3@", "@MUNCLEINLAW@", "@FAUNT@", ["@MCOUSIN@"]],
  ["@F4@", "@MCOUSIN@", "@FCOUSINWIFE@", ["@FCOUSINKID@"]],
  ["@F5@", "@MSISHUSBAND@", "@FSIS@", ["@MNEPHEW@"]],
  ["@F6@", "@MROOT@", "@FWIFE@", ["@UKID@"]],
  ["@F7@", "@UKID@", "@FKIDWIFE@", ["@MGRANDSON@"]],
  ["@F8@", "@MDAD@", "@FSTEPMOM@", ["@MHALFBRO@"]],
  ["@F9@", "", "", ["@MLONE1@", "@FLONE2@"]],
  ["@F10@", "@MWIFEDAD@", "", ["@FWIFE@", "@MWIFEBRO@"]],
  ["@F11@", "@MWIFEEX@", "@FWIFE@", ["@MSTEPSON@"]],
  ["@F12@", "@MWIFEBRO@", "", ["@MWIFENEPHEW@"]],
]);

describe("describeRelationship", () => {
  const describeFromRoot = (targetXref: string) =>
    describeRelationship(family, "@MROOT@", targetXref);

  it.each([
    ["@MROOT@", "self"],
    ["@MDAD@", "father"],
    ["@FMOM@", "mother"],
    ["@MGF@", "grandfather"],
    ["@FGM@", "grandmother"],
    ["@FSIS@", "sister"],
    ["@MHALFBRO@", "half-brother"],
    ["@FAUNT@", "aunt"],
    ["@MCOUSIN@", "first cousin"],
    ["@FCOUSINKID@", "first cousin once removed"],
    ["@MNEPHEW@", "nephew"],
    ["@UKID@", "child"],
    ["@MGRANDSON@", "grandson"],
    ["@FWIFE@", "wife"],
  ])("describes %s as the root's %s", (targetXref, relationship) => {
    expect(describeFromRoot(targetXref)).toBe(relationship);
  });

  it.each([
    ["@FSTEPMOM@", "stepmother"],
    ["@MSTEPSON@", "stepson"],
    ["@MWIFEDAD@", "father-in-law"],
    ["@MWIFEBRO@", "brother-in-law"],
    ["@MSISHUSBAND@", "brother-in-law"],
    ["@FKIDWIFE@", "daughter-in-law"],
    ["@MUNCLEINLAW@", "husband of the aunt"],
    ["@FCOUSINWIFE@", "wife of the first cousin"],
    ["@MWIFENEPHEW@", "nephew of the wife"],
    ["@MWIFEEX@", "husband of the wife"],
  ])(
    "describes %s through marriage as the root's %s",
    (targetXref, relationship) => {
      expect(describeFromRoot(targetXref)).toBe(relationship);
    },
  );

  it("finds no relationship to someone unconnected", () => {
    expect(describeFromRoot("@MLONE1@")).toBeUndefined();
  });

  it("treats children of one family as full siblings even with no parents recorded", () => {
    expect(describeRelationship(family, "@MLONE1@", "@FLONE2@")).toBe("sister");
  });

  it("is undefined when the root or target isn't in the file", () => {
    expect(describeFromRoot("@MISSING@")).toBeUndefined();
    expect(describeRelationship(family, "@MISSING@", "@MDAD@")).toBeUndefined();
  });

  it("describes from the root's side", () => {
    expect(describeRelationship(family, "@FCOUSINKID@", "@MROOT@")).toBe(
      "first cousin once removed",
    );
    expect(describeRelationship(family, "@MCOUSIN@", "@FAUNT@")).toBe("mother");
    expect(describeRelationship(family, "@MNEPHEW@", "@MROOT@")).toBe("uncle");
  });

  it("survives a loop in the ancestry", () => {
    const loop = buildDatabase([
      ["@F1@", "@MA@", "", ["@MB@"]],
      ["@F2@", "@MB@", "", ["@MA@"]],
    ]);
    expect(describeRelationship(loop, "@MA@", "@MB@")).toBe("son");
  });
});

describe("relationshipName", () => {
  it.each<[number, number, string, string]>([
    [0, 1, "F", "daughter"],
    [0, 3, "M", "great-grandson"],
    [0, 4, "", "2nd great-grandchild"],
    [3, 0, "M", "great-grandfather"],
    [4, 0, "F", "2nd great-grandmother"],
    [5, 0, "", "3rd great-grandparent"],
    [1, 1, "", "sibling"],
    [2, 1, "", "aunt or uncle"],
    [3, 1, "F", "great-aunt"],
    [4, 1, "M", "2nd great-uncle"],
    [1, 3, "M", "great-nephew"],
    [1, 2, "", "niece or nephew"],
    [2, 2, "", "first cousin"],
    [3, 3, "", "second cousin"],
    [2, 3, "", "first cousin once removed"],
    [4, 2, "", "first cousin twice removed"],
    [3, 5, "", "second cousin twice removed"],
    [12, 12, "", "11th cousin"],
    [2, 15, "", "first cousin 13 times removed"],
  ])(
    "names %i up from the root and %i up from the target (sex %j) %s",
    (rootGenerations, targetGenerations, sex, name) => {
      expect(relationshipName(rootGenerations, targetGenerations, sex)).toBe(
        name,
      );
    },
  );

  it("names half relationships", () => {
    expect(relationshipName(1, 1, "F", { half: true })).toBe("half-sister");
    expect(relationshipName(2, 1, "M", { half: true })).toBe("half-uncle");
    expect(relationshipName(3, 1, "F", { half: true })).toBe("half-great-aunt");
    expect(relationshipName(4, 1, "F", { half: true })).toBe(
      "half 2nd great-aunt",
    );
    expect(relationshipName(2, 2, "", { half: true })).toBe(
      "half first cousin",
    );
  });
});
