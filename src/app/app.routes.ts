import type { Routes } from "@angular/router";
import { IndexComponent } from "./index/index.component";
import { IndividualComponent } from "./individual/individual.component";
import { IndividualsComponent } from "./individuals/individuals.component";
import { SourcesComponent } from "./sources/sources.component";
import { SourceComponent } from "./source/source.component";
import { RepositoriesComponent } from "./repositories/repositories.component";
import { RepositoryComponent } from "./repository/repository.component";
import { GedcomComponent } from "./gedcom/gedcom.component";
import { ValidationComponent } from "./validation/validation.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { MultimediasComponent } from "./multimedias/multimedias.component";
import { MultimediaComponent } from "./multimedia/multimedia.component";

export const routes: Routes = [
  { path: "", component: IndexComponent },
  { path: "gedcom", component: GedcomComponent },
  { path: "individuals", component: IndividualsComponent },
  { path: "individual/:xref", component: IndividualComponent },
  { path: "repositories", component: RepositoriesComponent },
  { path: "repository/:xref", component: RepositoryComponent },
  { path: "sources", component: SourcesComponent },
  { path: "source/:xref", component: SourceComponent },
  { path: "multimedias", component: MultimediasComponent },
  { path: "multimedia/:xref", component: MultimediaComponent },
  { path: "validation", component: ValidationComponent },
  { path: "**", component: PageNotFoundComponent },
];
