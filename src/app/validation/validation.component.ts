import {Component, computed} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {sourceValidators} from '../../validators/source.validators';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './validation.component.html',
  styleUrl: './validation.component.css',
})
export class ValidationComponent {
  readonly ancestryService = ancestryService;

  readonly sourceScenarios = computed(() =>
    this.ancestryService.sources().toList()
        .map((source) => ({source: source, result: sourceValidators(source)})));
}
