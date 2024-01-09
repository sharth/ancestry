import { Component, inject, input } from '@angular/core'
import { AncestryService } from '../ancestry.service'

@Component({
  selector: 'app-fanchart',
  standalone: true,
  imports: [],
  templateUrl: './fanchart.component.html',
  styleUrl: './fanchart.component.css'
})
export class FanchartComponent {
  ancestryService = inject(AncestryService)
  xref = input.required<string>()
}
