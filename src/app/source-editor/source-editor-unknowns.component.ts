import {
  type GedcomRecord,
  serializeGedcomRecordToText,
} from "../../gedcom/gedcomRecord";
import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-editor-unknowns",
  templateUrl: "./source-editor-unknowns.component.html",
  styleUrl: "./source-editor.component.css",
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SourceEditorUnknownsComponent {
  readonly unknownRecords = input.required<GedcomRecord[]>();
  readonly removeUnknownRecord = output<GedcomRecord>();

  serializeGedcomRecordToText = serializeGedcomRecordToText;
}
