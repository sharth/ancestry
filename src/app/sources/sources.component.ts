import { Component } from '@angular/core';
import { AncestryService } from '../ancestry.service';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.css'
})
export class SourcesComponent {
  constructor(public ancestryService: AncestryService) {}
}
