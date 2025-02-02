import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import type { GedcomEvent } from "../../gedcom/gedcomEvent";

@Component({
  selector: "app-individual-editor-events",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatTableModule],
  templateUrl: "./individual-editor-events.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorEventsComponent {
  readonly events = input.required<GedcomEvent[]>();
  readonly addEvent = output();
  readonly removeEvent = output<GedcomEvent>();
}
