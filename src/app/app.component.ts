import { AncestryService } from "../database/ancestry.service";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatSidenavModule } from "@angular/material/sidenav";
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, MatSidenavModule, RouterLink],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly ancestryService = inject(AncestryService);

  async requestPermissions() {
    try {
      await this.ancestryService.requestPermissions();
    } catch (err) {
      console.error(err);
    }
  }

  async clearDatabase() {
    try {
      await this.ancestryService.clearDatabase();
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }
}
