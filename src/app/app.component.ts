import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'
import { AncestryService } from './ancestry.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  ancestryService = inject(AncestryService)

  gedcomFileChanged(el: EventTarget | null): void {
    if (!(el instanceof HTMLInputElement)) {
      throw new Error(`Expected el to be an HTMLInputElement, was ${el?.constructor?.name || el}`)
    }
    if (!(el.files instanceof FileList)) {
      throw new Error(`Expected el.files to be a FileList, was ${el?.constructor?.name || el}`)
    }

    if (el.files.length === 0) {
      this.ancestryService.reset()
    } else if (el.files.length === 1) {
      this.ancestryService.resetAndLoadFile(el.files[0])
    } else {
      throw new Error(`Expected el.files.length to be <= 1, was ${el.files.length}`)
    }
  };
};
