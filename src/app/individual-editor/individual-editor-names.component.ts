import type { GedcomName } from "../../gedcom/gedcomName";
import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";

@Component({
  selector: "app-individual-editor-names",
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatTableModule],
  templateUrl: "./individual-editor-names.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorNamesComponent {
  readonly names = input.required<GedcomName[]>();
  readonly addName = output();
  readonly removeName = output<GedcomName>();
}
