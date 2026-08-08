import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomEvent } from "../../gedcom/gedcomEvent";

@Component({
  selector: "app-events-table",
  imports: [RouterModule],
  templateUrl: "./events-table.component.html",
  styleUrl: "./events-table.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsTableComponent {
  readonly events = input.required<GedcomEvent[]>();
}
