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
    let family = this.individual().childOfFamily;
    if (family?.husband)
      relatives.push({ relationship: 'Father', individual: family.husband });
    if (family?.wife)
      relatives.push({ relationship: 'Mother', individual: family.wife });
    if (family?.children)
      relatives.push(...family.children
        .filter(sibling => sibling !== this.individual())
        .map(sibling => ({
          relationship: sibling.sex == 'Male' ? 'Brother' : sibling.sex == 'Female' ? 'Sister' : 'Sibling',
          individual: sibling,
        })));

    // Stepparents and Stepsiblings
    for (let parent of family?.parents() || []) {
      for (let stepfamily of parent.parentOfFamilies) {
        if (stepfamily !== family) {
          if (stepfamily.husband && stepfamily.husband !== family?.husband)
            relatives.push({ relationship: 'Stepfather', individual: stepfamily.husband });
          if (stepfamily.wife && stepfamily.wife !== family?.wife)
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

    // Spouse and children
    for (let family of this.individual().parentOfFamilies) {
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

    return relatives;
  }

  ancestors(): Array<Individual | undefined> {
    const ancestors = new Array<Individual | undefined>;
    ancestors[1] = this.individual();
    for (let i = 1; i < ancestors.length; i += 1) {
      if (ancestors[i]) {
        ancestors[2 * i + 0] = ancestors[i]?.childOfFamily?.husband;
        ancestors[2 * i + 1] = ancestors[i]?.childOfFamily?.wife
      }
    }
    return ancestors;
  }
}
