import {Component, computed} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-repositories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './repositories.component.html',
  styleUrl: './repositories.component.css',
})
export class RepositoriesComponent {
  readonly ancestryService = ancestryService;
  repositories = computed(() => this.ancestryService.repositories());
}
