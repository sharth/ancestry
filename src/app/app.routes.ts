import type { Routes } from "@angular/router";
import { ancestryDatabaseResolver } from "../database/ancestry.service";
import { HelloComponent } from "./hello/hello.component";
import { IndexComponent } from "./index/index.component";
import { IndividualAncestorsComponent } from "./individual/individual-ancestors.component";
import { IndividualFactsComponent } from "./individual/individual-facts.component";
import { IndividualGedcomComponent } from "./individual/individual-gedcom.component";
import { IndividualComponent } from "./individual/individual.component";
import { IndividualsComponent } from "./individuals/individuals.component";
import { MultimediaComponent } from "./multimedia/multimedia.component";
import { MultimediasComponent } from "./multimedias/multimedias.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { PlacesComponent } from "./places/places.component";
import { RepositoriesComponent } from "./repositories/repositories.component";
import { RepositoryComponent } from "./repository/repository.component";
import { SourceComponent } from "./source/source.component";
import { SourcesComponent } from "./sources/sources.component";
import { ValidationComponent } from "./validation/validation.component";

export const routes: Routes = [
  {
    path: "",
    component: IndexComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
  },
  {
    path: "hello",
    component: HelloComponent,
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
    children: [
      { path: "", redirectTo: "facts", pathMatch: "full" },
      { path: "facts", component: IndividualFactsComponent },
      { path: "ancestors", component: IndividualAncestorsComponent },
      { path: "gedcom", component: IndividualGedcomComponent },
    ],
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
    path: "places",
    component: PlacesComponent,
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
