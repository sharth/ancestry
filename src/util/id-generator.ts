import { Service } from "@angular/core";

// Element ids are global to the page, but Bootstrap's floating labels need
// `<label for>` to point at a sibling control by id. Components that render
// a label and control get their ids from here, so two instances on the same
// page don't share one. Use the component's selector minus "app-" as the
// prefix, e.g. "input-individual-xref".
@Service()
export class IdGenerator {
  private readonly counters = new Map<string, number>();

  // Returns `${prefix}-${n}`, with n counting up from 1 for each prefix.
  getId(prefix: string): string {
    const count = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, count);
    return `${prefix}-${count}`;
  }
}
