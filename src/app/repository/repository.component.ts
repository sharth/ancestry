import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { toObservable } from "@angular/core/rxjs-interop";
import * as rxjs from "rxjs";
import * as dexie from "dexie";
import { ancestryDatabase } from "../../database/ancestry.database";

@Component({
  selector: "app-repository",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./repository.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositoryComponent {
  xref = input.required<string>();

  readonly vm$ = toObservable(this.xref).pipe(
    rxjs.switchMap((xref) =>
      dexie.liveQuery(() => ancestryDatabase.repositories.get(xref)),
    ),
    rxjs.combineLatestWith(
      dexie.liveQuery(() => ancestryDatabase.sources.toArray()),
    ),
    rxjs.map(([repository, sources]) => {
      if (repository == null) return null;
      return {
        repository,
        sources: sources
          .flatMap((source) =>
            source.repositoryCitations.map((repositoryCitation) => ({
              source,
              repositoryCitation,
            })),
          )
          .filter(
            ({ repositoryCitation }) =>
              repositoryCitation.repositoryXref == this.xref(),
          )
          .map(({ source, repositoryCitation }) => ({
            xref: source.xref,
            abbr: source.abbr,
            callNumbers: repositoryCitation.callNumbers,
          })),
      };
    }),
  );
}
