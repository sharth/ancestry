import { Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomFact } from "../../gedcom/gedcomFact";

@Component({
  selector: "app-events-table",
  imports: [RouterModule],
  templateUrl: "./events-table.component.html",
  styleUrl: "./events-table.component.css",
})
export class EventsTableComponent {
  readonly events = input.required<GedcomFact[]>();
}
