import { Component, input } from "@angular/core";

@Component({
  selector: "app-fanchart",
  standalone: true,
  imports: [],
  templateUrl: "./fanchart.component.html",
  styleUrl: "./fanchart.component.css",
})
export class FanchartComponent {
  xref = input.required<string>();
}
