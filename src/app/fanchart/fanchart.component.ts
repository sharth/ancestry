import { Component, input } from "@angular/core";
import { ancestryService } from "../ancestry.service";

@Component({
  selector: "app-fanchart",
  standalone: true,
  imports: [],
  templateUrl: "./fanchart.component.html",
  styleUrl: "./fanchart.component.css",
})
export class FanchartComponent {
  readonly ancestryService = ancestryService;
  xref = input.required<string>();
}
