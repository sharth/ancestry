import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ancestryService } from "./ancestry.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  async openFile(): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Gedcom Files",
          accept: { "text/plain": [".ged"] },
        },
      ],
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    ancestryService.parseText(text);
  }
}
