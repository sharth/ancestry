import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-validation",
  imports: [CommonModule, RouterModule],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
})
export class ValidationComponent {
  // readonly sourceScenarios = computed(() =>
  //   this.ancestryService.sources().toList()
  //       .map((source) => ({source: source, result: sourceValidators(source)})));
}
