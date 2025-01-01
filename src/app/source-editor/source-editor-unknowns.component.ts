import { Component, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { serializeGedcomRecordToText, type GedcomRecord } from "../../gedcom";

@Component({
  selector: "app-source-editor-unknowns",
  standalone: true,
  templateUrl: "./source-editor-unknowns.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SourceEditorUnknownsComponent {
  readonly unknownRecords = input.required<GedcomRecord[]>();
  readonly removeUnknownRecord = output<GedcomRecord>();

  serializeGedcomRecordToText = serializeGedcomRecordToText;
}
