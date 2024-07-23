import {ancestryService} from '../app/ancestry.service';

export class GedcomSourceRepository {
  constructor(readonly repositoryXref: string, readonly callNumbers: string[]) {}

  repository() {
    return ancestryService.repository(this.repositoryXref);
  }
}
