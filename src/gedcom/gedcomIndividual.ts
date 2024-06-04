import {type GedcomEvent} from './gedcomEvent';
import {type GedcomFamily} from './gedcomFamily';
import {type GedcomRecord} from './gedcomRecord';

export class GedcomIndividual {
  constructor(
    public xref: string) { }

  events: GedcomEvent[] = [];
  name?: string;
  surname?: string;
  sex?: ('Male' | 'Female');
  familySearchId?: string;
  childOfFamily?: GedcomFamily;
  parentOfFamilies: GedcomFamily[] = [];
  gedcomRecord?: GedcomRecord;

  censusEvents(): GedcomEvent[] {
    return this.events.filter((gedcomEvent) => gedcomEvent.type === 'Census');
  }

  relatives(): { relationship: string, individual: GedcomIndividual }[] {
    const relatives = [];

    // Parents and Siblings
    const family = this.childOfFamily;
    if (family?.husband != null) {
      relatives.push({relationship: 'Father', individual: family.husband});
    }
    if (family?.wife != null) {
      relatives.push({relationship: 'Mother', individual: family.wife});
    }
    if (family?.children != null) {
      relatives.push(...family.children
          .filter((sibling) => sibling !== this)
          .map((sibling) => ({
            relationship: sibling.sex === 'Male' ? 'Brother' : sibling.sex === 'Female' ? 'Sister' : 'Sibling',
            individual: sibling,
          })));
    }

    // Stepparents and Stepsiblings
    for (const parent of family?.parents() ?? []) {
      for (const stepfamily of parent.parentOfFamilies) {
        if (stepfamily !== family) {
          if ((stepfamily.husband != null) && stepfamily.husband !== family?.husband) {
            relatives.push({relationship: 'Stepfather', individual: stepfamily.husband});
          }
          if ((stepfamily.wife != null) && stepfamily.wife !== family?.wife) {
            relatives.push({relationship: 'Stepmother', individual: stepfamily.wife});
          }
          relatives.push(...stepfamily.children
              .map((stepsibling) => ({
                relationship: stepsibling.sex === 'Male' ? 'Stepbrother' : stepsibling.sex === 'Female' ? 'Stepsister' : 'Stepsibling',
                individual: stepsibling,
              })));
        }
      }
    }

    // Spouse and children
    for (const family of this.parentOfFamilies) {
      if (family.husband != null && family.husband !== this) {
        relatives.push({relationship: 'Husband', individual: family.husband});
      }
      if (family.wife != null && family.wife !== this) {
        relatives.push({relationship: 'Wife', individual: family.wife});
      }
      relatives.push(...family.children
          .map((child) => ({
            relationship: child.sex === 'Male' ? 'Son' : child.sex === 'Female' ? 'Daughter' : 'Child',
            individual: child,
          })));
    }

    return relatives;
  }
};
