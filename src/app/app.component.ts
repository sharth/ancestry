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

  async openFile(): Promise<void> {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: 'Gedcom Files',
        accept: {'text/plain': ['.ged']},
      }],
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    this.parseSomeText(text);
  }

  parseSomeText(text: string): void {
    localStorage.setItem('text', text);
    return this.ancestryService.parseText(text);
  }
}
