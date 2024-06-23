import {CommonModule} from '@angular/common';
import {Component, inject} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {AncestryService} from './ancestry.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  ancestryService = inject(AncestryService);

  ngOnInit() {
    const text = localStorage.getItem('text');
    if (text != null) {
      this.parseSomeText(text);
    }
  }

  gedcomFileChanged(el: EventTarget): void {
    if (!(el instanceof HTMLInputElement)) {
      throw new Error(`Expected el to be an HTMLInputElement, was ${el?.constructor?.name || el}`);
    }
    if (!(el.files instanceof FileList)) {
      throw new Error(`Expected el.files to be a FileList, was ${el?.constructor?.name || el}`);
    }

    if (el.files.length === 0) {
      this.parseSomeText('');
    } else if (el.files.length === 1) {
      this.parseSomeFile(el.files[0]);
    } else {
      throw new Error(`Expected el.files.length to be <= 1, was ${el.files.length}`);
    }
  }

  async parseSomeFile(file: File): Promise<void> {
    const response = await file.text();
    this.parseSomeText(response);
  }

  parseSomeText(text: string): void {
    localStorage.setItem('text', text);
    return this.ancestryService.parseText(text);
  }
}
