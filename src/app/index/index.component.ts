import { Component, inject } from '@angular/core'
import { AncestryService } from '../ancestry.service'

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css'
})
export class IndexComponent {
  ancestryService = inject(AncestryService)
}
