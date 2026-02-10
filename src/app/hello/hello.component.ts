import { AncestryService } from "../../database/ancestry.service";
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-hello",
  imports: [],
  templateUrl: "./hello.component.html",
  styleUrl: "./hello.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelloComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);

  readonly gedcomResource = this.ancestryService.gedcomResource;

  async openGedcom() {
    try {
      await this.ancestryService.openGedcom();
      // If successful, we can optionally navigate or just let the user see the file is loaded.
      // The user request says: "If a gedcom file is loaded, perhaps we should ask the user if they would like to load a new file on this page."
      // But also "If no gedcom file is loaded, we should always redirect the user to the /hello page."
      // If we seek to make it "better", upon loading, we probably want to send them to the main view if they just loaded it?
      // Or maybe stay here. The requirements didn't explicitly say "auto-redirect after load", but standard flow implies it.
      // However, keeping them here allows them to load multimedia too.
      // Let's stick to the prompt: "The file handle for both of these should get stored in the dexie database."
      // I'll leave them here to optionally load multimedia, but maybe provide a "Go to App" button if loaded.
    } catch (err) {
      console.error(err);
    }
  }

  async openMultimedia() {
    try {
      await this.ancestryService.openMultimedia();
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
