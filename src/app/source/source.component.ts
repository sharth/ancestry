import { Component, Input } from '@angular/core';
import { AncestryService, Source } from '../ancestry.service'

@Component({
  selector: 'app-source',
  standalone: true,
  imports: [],
  templateUrl: './source.component.html',
  styleUrl: './source.component.css'
})
export class SourceComponent {
  @Input({ required: true }) xref!: string;

  constructor(private ancestryService: AncestryService) { }

  source(): Source {
    return this.ancestryService.source(this.xref);
  }
}
