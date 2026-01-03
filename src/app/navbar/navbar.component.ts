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

  async openFile() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Gedcom",
            accept: {
              "text/plain": [".ged"],
            },
          },
        ],
      });
      await this.ancestryService.openGedcom(fileHandle);
      console.log("Parsing complete");
    } catch (err) {
      console.error(err);
    }
  }

  async requestPermissions() {
    try {
      await this.ancestryService.requestPermissions();
    } catch (err) {
      console.error(err);
    }
  }
}
