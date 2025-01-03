import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import type { GedcomIndividualName } from "../../gedcom";

@Component({
  selector: "app-individual-editor-names",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatTableModule],
  templateUrl: "./individual-editor-names.component.html",
  styleUrl: "./individual-editor.component.css",
})
export class IndividualEditorNamesComponent {
  readonly names = input.required<GedcomIndividualName[]>();
  readonly addName = output();
  readonly removeName = output<GedcomIndividualName>();
}
