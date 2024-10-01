import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { toObservable } from "@angular/core/rxjs-interop";
import * as rxjs from "rxjs";
import * as dexie from "dexie";
import { ancestryDatabase } from "../../database/ancestry.database";

@Component({
  selector: "app-multimedia",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./multimedia.component.html",
  styleUrl: "./multimedia.component.css",
})
export class MultimediaComponent {
  xref = input.required<string>();

  readonly vm$ = toObservable(this.xref).pipe(
    rxjs.switchMap((xref) =>
      dexie.liveQuery(() => ancestryDatabase.multimedia.get(xref)),
    ),
    rxjs.map((multimedia) => {
      if (multimedia == null) return null;
      return {
        multimedia,
      };
    }),
  );
}
