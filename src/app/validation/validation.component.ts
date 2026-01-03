import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-validation",
  imports: [RouterModule],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationComponent {
  // readonly sourceScenarios = computed(() =>
  //   this.ancestryService.sources().toList()
  //       .map((source) => ({source: source, result: sourceValidators(source)})));
}
