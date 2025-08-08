import { AncestryService } from "../../database/ancestry.service";
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
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
      const file = await fileHandle.getFile();
      const text = await file.text();
      await this.ancestryService.initializeDatabase(text);
      console.log("Parsing complete");
    } catch (err) {
      console.error(err);
    }
  }
}
