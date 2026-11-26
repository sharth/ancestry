import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";
import { produce } from "immer";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  ValidationTableComponent,
  type ValidationRow,
} from "./validation-table.component";

/** A call number that is the same URL as another of its source's call
 * numbers, plus a query string. */
export interface QueryStringCallNumber {
  withQuery: string;
  withoutQuery: string;
}

/** `callNumber` parsed as an http(s) URL, or undefined. */
function parseUrl(callNumber: string): URL | undefined {
  const url = URL.parse(callNumber.trim());
  return url?.protocol === "http:" || url?.protocol === "https:"
    ? url
    : undefined;
}

/** The call numbers on `source` (under any of its repository links) that
 * differ from another of its call numbers only by having a query string. */
export function queryStringCallNumbers(
  source: GedcomSource,
): QueryStringCallNumber[] {
  const callNumbers = source.repositoryLinks.flatMap(
    (link) => link.callNumbers,
  );
  // Call numbers with no query string, by their normalized URL.
  const withoutQuery = new Map<string, string>();
  for (const callNumber of callNumbers) {
    const url = parseUrl(callNumber);
    if (url?.search === "") {
      withoutQuery.set(url.href, callNumber);
    }
  }
  const found: QueryStringCallNumber[] = [];
  for (const callNumber of callNumbers) {
    const url = parseUrl(callNumber);
    if (url === undefined || url.search === "") continue;
    url.search = "";
    const bare = withoutQuery.get(url.href);
    if (bare !== undefined && !found.some((f) => f.withQuery === callNumber)) {
      found.push({ withQuery: callNumber, withoutQuery: bare });
    }
  }
  return found;
}

/** The sources with a call number that repeats another without its query
 * string. */
export function findQueryStringCallNumbers(
  database: GedcomDatabase,
): GedcomSource[] {
  return Object.values(database.sources).filter(
    (source) => queryStringCallNumbers(source).length > 0,
  );
}

/** Drops, from each of `xrefs`' sources, every call number that repeats
 * another without its query string. Pure -- doesn't mutate `database`. */
export function removeQueryStringCallNumbers(
  database: GedcomDatabase,
  xrefs: string[],
): GedcomDatabase {
  return produce(database, (draft) => {
    for (const xref of xrefs) {
      const source = draft.sources[xref];
      if (source === undefined) continue;
      const remove = new Set(
        queryStringCallNumbers(source).map((found) => found.withQuery),
      );
      for (const link of source.repositoryLinks) {
        link.callNumbers = link.callNumbers.filter(
          (callNumber) => !remove.has(callNumber),
        );
      }
    }
  });
}

/** Lists the call numbers that are another of their source's call numbers
 * plus a query string, and suggests removing them, keeping the URL without
 * the query string. */
@Component({
  selector: "app-query-string-call-numbers",
  imports: [
    RouterModule,
    RepositoryCallNumberComponent,
    ValidationTableComponent,
  ],
  templateUrl: "./query-string-call-numbers.component.html",
})
export class QueryStringCallNumbersComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(
    () =>
      findQueryStringCallNumbers(this.ancestryDatabase()).map((source) => ({
        key: source.xref,
        source,
        callNumbers: queryStringCallNumbers(source),
        fixedDatabase: removeQueryStringCallNumbers(this.ancestryDatabase(), [
          source.xref,
        ]),
        editorTabs: [{ type: "SOUR" as const, xref: source.xref }],
      })) satisfies ValidationRow[],
  );

  readonly fixAll = () =>
    removeQueryStringCallNumbers(
      this.ancestryDatabase(),
      this.rows().map((row) => row.source.xref),
    );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}
