import type { Signal } from "@angular/core";
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import * as rxjs from "rxjs";
import * as dexie from "dexie";
import { toSignal } from "@angular/core/rxjs-interop";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { ancestryDatabase } from "../../database/ancestry.database";

@Component({
  selector: "app-sources",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./sources.component.html",
  styleUrl: "./sources.component.css",
})
export class SourcesComponent {
  readonly sources$ = rxjs
    .from(dexie.liveQuery(() => ancestryDatabase.sources.toArray()))
    .pipe(
      rxjs.map((sources) =>
        sources.sort((lhs, rhs) =>
          (lhs.abbr ?? "").localeCompare(rhs.abbr ?? ""),
        ),
      ),
    );
  readonly sources: Signal<GedcomSource[]> = toSignal(this.sources$, {
    initialValue: [],
  });
}
