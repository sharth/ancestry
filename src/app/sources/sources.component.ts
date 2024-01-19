import { Component } from '@angular/core';
import { AncestryService } from '../ancestry.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.css'
})
export class SourcesComponent {
  constructor(public ancestryService: AncestryService) {}

  sources() {
    return this.ancestryService.sources();
  }
}
