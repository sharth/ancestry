import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
  private readonly ancestryService = inject(AncestryService);

  openFile() {
    pickFileFromUser()
      .then((file) => readFile(file))
      .then((text) => this.ancestryService.initializeDatabase(text))
      .then(() => {
        console.log("Parsing complete");
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }
}

async function pickFileFromUser(): Promise<File> {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [
      {
        description: "Gedcom Files",
        accept: { "text/plain": [".ged"] },
      },
    ],
  });
  return fileHandle.getFile();
}

function readFile(file: File): Promise<string> {
  return file.text();
}
