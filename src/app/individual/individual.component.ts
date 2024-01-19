import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { AncestryService, Individual, Family } from '../ancestry.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-individual',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './individual.component.html',
  styleUrl: './individual.component.css'
})
export class IndividualComponent {
  @Input({ required: true }) xref!: string;

  constructor(private ancestryService: AncestryService) { }

  individual(): Individual {
    return this.ancestryService.individual(this.xref);
  }

  relatives() {
    const relatives = [];

    // Parents and Siblings
    let childOfFamily: (Family | null) = null;
    for (let family of this.ancestryService.families()) {
      for (let child of family.children) {
        if (child === this.individual()) {
          childOfFamily = family;
          if (family.husband)
            relatives.push({ relationship: 'Father', individual: family.husband });
          if (family.wife)
            relatives.push({ relationship: 'Mother', individual: family.wife });
          if (family.children)
            relatives.push(...family.children
              .filter(sibling => sibling.xref != this.xref)
              .map(sibling => ({
                relationship: sibling.sex == 'Male' ? 'Brother' : sibling.sex == 'Female' ? 'Sister' : 'Sibling',
                individual: sibling,
              })));
        }
      }
    }
    // Stepparents and Stepsiblings
    if (childOfFamily) {
      for (let stepfamily of this.ancestryService.families()) {
        if (stepfamily !== childOfFamily) {
          if ((stepfamily.husband && stepfamily.husband === childOfFamily.husband) || (stepfamily.wife && stepfamily.wife === childOfFamily.wife)) {
            if (stepfamily.husband && stepfamily.husband !== childOfFamily.husband)
              relatives.push({ relationship: 'Stepfather', individual: stepfamily.husband });
            if (stepfamily.wife && stepfamily.wife !== childOfFamily.wife)
              relatives.push({ relationship: 'Stepmother', individual: stepfamily.wife });
            if (stepfamily.children)
              relatives.push(...stepfamily.children
                .map(stepsibling => ({
                  relationship: stepsibling.sex == 'Male' ? 'Stepbrother' : stepsibling.sex == 'Female' ? 'Stepsister' : 'Stepsibling',
                  individual: stepsibling,
                })));
          }
        }
      }
    }
    // Spouse and children
    for (let family of this.ancestryService.families()) {
      if (family.husband === this.individual() || family.wife === this.individual()) {
        if (family.husband && family.husband !== this.individual())
          relatives.push({ relationship: 'Husband', individual: family.husband });
        if (family.wife && family.wife !== this.individual())
          relatives.push({ relationship: 'Wife', individual: family.wife })
        if (family.children)
          relatives.push(...family.children
            .map(child => ({
              relationship: child.sex == 'Male' ? "Son" : child.sex == 'Female' ? 'Daughter' : 'Child',
              individual: child,
            })))
      }
    }
    return relatives;
  }
}
