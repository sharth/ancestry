import { Component, computed, inject, input } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { type GedcomSource } from '../../gedcom'

@Component({
  selector: 'app-source',
  standalone: true,
  imports: [],
  templateUrl: './source.component.html',
  styleUrl: './source.component.css'
})
export class SourceComponent {
  ancestryService = inject(AncestryService)
  xref = input.required<string>()
  source = computed(() => this.ancestryService.source(this.xref()))
}
