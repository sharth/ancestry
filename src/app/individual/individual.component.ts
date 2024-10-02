import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import type { GedcomEvent } from "../../gedcom/gedcomEvent";
import { serializeGedcomRecordToText } from "../../util/gedcom-serializer";
import { serializeGedcomIndividual } from "../../util/gedcom-serializer";
import { serializeGedcomEvent } from "../../util/gedcom-serializer";
import { toObservable } from "@angular/core/rxjs-interop";
import { ancestryDatabase } from "../../database/ancestry.database";
import * as rxjs from "rxjs";
import * as dexie from "dexie";
import type { GedcomIndividual } from "../../gedcom/gedcomIndividual";
import type { GedcomFamily } from "../../gedcom/gedcomFamily";

@Component({
  selector: "app-individual",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./individual.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualComponent {
  readonly xref = input.required<string>();
  readonly vm$ = toObservable(this.xref).pipe(
    rxjs.switchMap((xref) =>
      dexie.liveQuery(() => ancestryDatabase.individuals.get(xref))
    ),
    rxjs.combineLatestWith(
      dexie.liveQuery(() => ancestryDatabase.individuals.toArray()),
      dexie.liveQuery(() => ancestryDatabase.families.toArray())
    ),
    rxjs.map(([individual, individuals, families]) => {
      if (individual == null) {
        return null;
      }
      return {
        ...individual,
        events: individual.events.map((event) => ({
          ...event,
          gedcom: serializeGedcomRecordToText(serializeGedcomEvent(event)).join(
            "\n"
          ),
        })),
        ancestors: this.ancestors(individual, individuals, families),
        relatives: this.relatives(individual, individuals, families),
        gedcom: serializeGedcomRecordToText(
          serializeGedcomIndividual(individual)
        ).join("\n"),
      };
    })
  );

  ancestors(
    self: GedcomIndividual,
    individuals: GedcomIndividual[],
    families: GedcomFamily[]
  ): (GedcomIndividual | undefined)[] {
    const ancestors: (GedcomIndividual | undefined)[] = [];
    ancestors[1] = self;
    for (let i = 1; i < ancestors.length && i < 16384; i++) {
      const child = ancestors[i];
      if (child != null) {
        const family = families.find((family) =>
          family.childXrefs.includes(child.xref)
        );
        if (family?.husbandXref) {
          ancestors[2 * i + 0] = individuals.find(
            (individual) => individual.xref == family.husbandXref
          );
        }
        if (family?.wifeXref) {
          ancestors[2 * i + 1] = individuals.find(
            (individual) => individual.xref == family.wifeXref
          );
        }
      }
    }
    return ancestors;
  }

  relatives(
    self: GedcomIndividual,
    individuals: GedcomIndividual[],
    families: GedcomFamily[]
  ): { relationship: string; individual: GedcomIndividual }[] {
    const parents: GedcomIndividual[] = families
      .filter((family) => family.childXrefs.includes(self.xref))
      .flatMap((family) => [family.husbandXref, family.wifeXref])
      .filter((parentXref) => parentXref != null)
      .map((parentXref) =>
        individuals.find((parent) => parent.xref == parentXref)
      )
      .filter((parent) => parent != null);
    const siblings: GedcomIndividual[] = families
      .filter((family) => family.childXrefs.includes(self.xref))
      .flatMap((family) => family.childXrefs)
      .map((siblingXref) =>
        individuals.find((sibling) => sibling.xref == siblingXref)
      )
      .filter((sibling) => sibling != null)
      .filter((sibling) => self.xref != sibling.xref);
    const spouses: GedcomIndividual[] = families
      .filter(
        (family) =>
          family.husbandXref == self.xref || family.wifeXref == self.xref
      )
      .flatMap((family) => [family.husbandXref, family.wifeXref])
      .filter((spouseXref) => spouseXref != null)
      .filter((spouseXref) => spouseXref != self.xref)
      .map((spouseXref) =>
        individuals.find((spouse) => spouseXref == spouse.xref)
      )
      .filter((spouse) => spouse != null);
    const children: GedcomIndividual[] = families
      .filter(
        (family) =>
          family.husbandXref == self.xref || family.wifeXref == self.xref
      )
      .flatMap((family) => family.childXrefs)
      .map((childXref) => individuals.find((child) => child.xref == childXref))
      .filter((child) => child != null);
    return [
      ...parents.map((parent) => ({
        relationship:
          parent.sex == "Male"
            ? "Father"
            : parent.sex == "Female"
              ? "Mother"
              : "Parent",
        individual: parent,
      })),
      ...siblings.map((sibling) => ({
        relationship:
          sibling.sex == "Male"
            ? "Brother"
            : sibling.sex == "Female"
              ? "Sister"
              : "Sibling",
        individual: sibling,
      })),
      ...spouses.map((spouse) => ({
        relationship:
          spouse.sex == "Male"
            ? "Husband"
            : spouse.sex == "Female"
              ? "Wife"
              : "Spouse",
        individual: spouse,
      })),
      ...children.map((child) => ({
        relationship:
          child.sex == "Male"
            ? "Son"
            : child.sex == "Female"
              ? "Daughter"
              : "Child",
        individual: child,
      })),
    ];
  }

  private readonly showEventGedcomMap = new Map<GedcomEvent, boolean>();
  toggleGedcom(event: GedcomEvent): void {
    const status: boolean = this.showEventGedcomMap.get(event) ?? false;
    this.showEventGedcomMap.set(event, !status);
  }

  showGedcom(event: GedcomEvent): boolean {
    return this.showEventGedcomMap.get(event) ?? false;
  }
}
