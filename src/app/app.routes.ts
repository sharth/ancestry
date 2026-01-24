import { ancestryDatabaseResolver } from "../database/ancestry.service";
import { IndexComponent } from "./index/index.component";
import { IndividualComponent } from "./individual/individual.component";
import { IndividualsComponent } from "./individuals/individuals.component";
import { MultimediaComponent } from "./multimedia/multimedia.component";
import { MultimediasComponent } from "./multimedias/multimedias.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { RepositoriesComponent } from "./repositories/repositories.component";
import { RepositoryComponent } from "./repository/repository.component";
import { SourceComponent } from "./source/source.component";
import { SourcesComponent } from "./sources/sources.component";
import { ValidationComponent } from "./validation/validation.component";
import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    component: IndexComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "individuals",
    component: IndividualsComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "individual/:xref",
    component: IndividualComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "repositories",
    component: RepositoriesComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "repository/:xref",
    component: RepositoryComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "sources",
    component: SourcesComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "source/:xref",
    component: SourceComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "multimedias",
    component: MultimediasComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "multimedia/:xref",
    component: MultimediaComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  { path: "validation", component: ValidationComponent },
  { path: "**", component: PageNotFoundComponent },
];
