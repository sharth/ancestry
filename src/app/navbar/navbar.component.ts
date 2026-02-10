import { AncestryService } from "../../database/ancestry.service";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-navbar",
  imports: [RouterLink],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
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
