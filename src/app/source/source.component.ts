import { Component, computed, inject, input } from '@angular/core'
import { AncestryService } from '../ancestry.service'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-source',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './source.component.html',
  styleUrl: './source.component.css'
})
export class SourceComponent {
  ancestryService = inject(AncestryService)
  xref = input.required<string>()
  source = computed(() => this.ancestryService.source(this.xref()))
}
