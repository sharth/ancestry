import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AncestryService } from './ancestry.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'angular';
  ancestryService: AncestryService = inject(AncestryService);

  gedcomFileChanged(el: EventTarget | null) {
    if (!(el instanceof HTMLInputElement))
      throw new Error(`Expected el to be an HTMLInpuElement, was ${el?.constructor?.name || el}`);
    if (!(el.files instanceof FileList))
      throw new Error(`Expected el.files to be a FileList, was ${el?.constructor?.name || el}`);
    if (el.files.length > 1)
      throw new Error(`Expected el.files.length to be <= 1, was ${el.files.length}`);

    if (el.files.length == 0) {
      this.ancestryService.reset();
    } else {
      this.ancestryService.resetAndLoadFile(el.files[0]);
    }
  };
};
