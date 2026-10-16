import { Component, computed, input } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import {
  computePlaceGroups,
  placeHierarchy,
  placeSlug,
} from "../places/places.util";
import { bestMatchRank, matchRank, type MatchRank } from "./search.util";

interface SearchResult {
  rank: MatchRank;
  label: string;
}

interface IndividualResult extends SearchResult {
  xref: string;
}

interface FamilyResult extends SearchResult {
  xref: string;
  husbandXref: string;
  wifeXref: string;
}

interface LinkResult extends SearchResult {
  xref: string;
}

interface PlaceResult extends SearchResult {
  slugs: string[];
}

@Component({
  selector: "app-search",
  imports: [RouterLink, IndividualLinkComponent],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.css",
})
export class SearchComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly q = input<string>("");

  readonly vm = computed(() => {
    const database = this.ancestryDatabase();
    const query = this.q().trim();

    if (!query) {
      return {
        query,
        individuals: [],
        families: [],
        sources: [],
        repositories: [],
        multimedias: [],
        places: [],
      };
    }

    const individuals = this.searchIndividuals(database, query);
    const families = this.searchFamilies(database, query);
    const sources = this.searchByLabel(
      Object.values(database.sources).map((s) => ({
        xref: s.xref,
        label: s.title,
      })),
      query,
    );
    const repositories = this.searchByLabel(
      Object.values(database.repositories).map((r) => ({
        xref: r.xref,
        label: r.name,
      })),
      query,
    );
    const multimedias = this.searchByLabel(
      Object.values(database.multimedias).map((m) => ({
        xref: m.xref,
        label: m.title || m.filePath,
      })),
      query,
    );
    const places = this.searchPlaces(database, query);

    return {
      query,
      individuals,
      families,
      sources,
      repositories,
      multimedias,
      places,
    };
  });

  private searchIndividuals(
    database: GedcomDatabase,
    query: string,
  ): IndividualResult[] {
    const results: IndividualResult[] = [];
    for (const individual of Object.values(database.individuals)) {
      const haystacks = individual.names.flatMap((name) => [
        [
          name.prefix,
          name.givenName,
          name.nickName,
          name.surnamePrefix,
          name.surname,
          name.suffix,
        ]
          .filter(Boolean)
          .join(" "),
        name.nickName,
      ]);
      const rank = bestMatchRank(haystacks, query);
      if (rank !== undefined) {
        results.push({
          xref: individual.xref,
          label: fullname(individual),
          rank,
        });
      }
    }
    return this.sortResults(results);
  }

  private searchFamilies(
    database: GedcomDatabase,
    query: string,
  ): FamilyResult[] {
    const nameOf = (xref: string) => {
      const individual = database.individuals[xref];
      return individual ? fullname(individual) : "";
    };
    const results: FamilyResult[] = [];
    for (const family of Object.values(database.families)) {
      const husbandName = nameOf(family.husbandXref);
      const wifeName = nameOf(family.wifeXref);
      const rank = bestMatchRank([husbandName, wifeName], query);
      if (rank !== undefined) {
        const label = [husbandName, wifeName].filter(Boolean).join(" & ");
        results.push({
          xref: family.xref,
          husbandXref: family.husbandXref,
          wifeXref: family.wifeXref,
          label: label || family.xref,
          rank,
        });
      }
    }
    return this.sortResults(results);
  }

  private searchByLabel(
    items: { xref: string; label: string }[],
    query: string,
  ): LinkResult[] {
    const results: LinkResult[] = [];
    for (const item of items) {
      const rank = matchRank(item.label, query);
      if (rank !== undefined) {
        results.push({ xref: item.xref, label: item.label, rank });
      }
    }
    return this.sortResults(results);
  }

  private searchPlaces(database: GedcomDatabase, query: string): PlaceResult[] {
    const results: PlaceResult[] = [];
    for (const place of computePlaceGroups(database)) {
      const rank = matchRank(place.name, query);
      if (rank !== undefined) {
        results.push({
          slugs: placeHierarchy(place.name).map(placeSlug),
          label: place.name,
          rank,
        });
      }
    }
    return this.sortResults(results);
  }

  private sortResults<T extends SearchResult>(results: T[]): T[] {
    return results.sort(
      (a, b) => a.rank - b.rank || a.label.localeCompare(b.label),
    );
  }
}
