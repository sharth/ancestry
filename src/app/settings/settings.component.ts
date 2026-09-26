import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-settings",
  imports: [],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
})
export class SettingsComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);

  readonly gedcomResource = this.ancestryService.gedcomResource;

  async openGedcom() {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Gedcom",
            accept: { "text/plain": [".ged"] },
          },
        ],
      });
      await this.ancestryService.openGedcom(fileHandle);
    } catch (err) {
      console.error(err);
    }
  }

  async openMultimedia() {
    try {
      const directoryHandle = await window.showDirectoryPicker({
        id: "multimedia",
        mode: "read",
      });
      await this.ancestryService.openMultimedia(directoryHandle);
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

  async clearDatabase() {
    try {
      await this.ancestryService.clearDatabase();
    } catch (err) {
      console.error(err);
    }
  }

  async enterApp() {
    await this.router.navigate(["/"]);
  }
}
