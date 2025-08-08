import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { GedcomEvent } from "../../gedcom/gedcomEvent";

@Component({
  selector: "app-events-table",
  imports: [CommonModule, RouterModule],
  templateUrl: "./events-table.component.html",
  styleUrl: "./events-table.component.css",
})
export class EventsTableComponent {
  readonly events = input.required<GedcomEvent[]>();
}
