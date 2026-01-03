import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "app-page-not-found",
  imports: [],
  templateUrl: "./page-not-found.component.html",
  styleUrl: "./page-not-found.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageNotFoundComponent {}
