import type { GedcomEvent } from "../../gedcom/gedcomEvent";
import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-events-table",
  imports: [CommonModule, RouterModule],
  templateUrl: "./events-table.component.html",
  styleUrl: "./events-table.component.css",
})
export class EventsTableComponent {
  readonly events = input.required<GedcomEvent[]>();
}
