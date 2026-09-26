import type { Routes } from "@angular/router";
import { ancestryDatabaseResolver } from "../database/ancestry.service";
import { FamiliesComponent } from "./families/families.component";
import { FamilyFactsComponent } from "./family/family-facts.component";
import { FamilyGedcomComponent } from "./family/family-gedcom.component";
import { FamilySourcesComponent } from "./family/family-sources.component";
import { FamilyComponent } from "./family/family.component";
import { HelloComponent } from "./hello/hello.component";
import { IndexComponent } from "./index/index.component";
import { IndividualAncestorsComponent } from "./individual/individual-ancestors.component";
import { IndividualFactsComponent } from "./individual/individual-facts.component";
import { IndividualGedcomComponent } from "./individual/individual-gedcom.component";
import { IndividualSourcesComponent } from "./individual/individual-sources.component";
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
    runGuardsAndResolvers: "always",
  },
  {
    path: "hello",
    component: HelloComponent,
  },
  {
    path: "individuals",
    component: IndividualsComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "individual/:xref",
    component: IndividualComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
    children: [
      { path: "", redirectTo: "facts", pathMatch: "full" },
      { path: "facts", component: IndividualFactsComponent },
      { path: "ancestors", component: IndividualAncestorsComponent },
      { path: "sources", component: IndividualSourcesComponent },
      { path: "gedcom", component: IndividualGedcomComponent },
    ],
  },
  {
    path: "families",
    component: FamiliesComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "family/:xref",
    component: FamilyComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
    children: [
      { path: "", redirectTo: "facts", pathMatch: "full" },
      { path: "facts", component: FamilyFactsComponent },
      { path: "sources", component: FamilySourcesComponent },
      { path: "gedcom", component: FamilyGedcomComponent },
    ],
  },
  {
    path: "repositories",
    component: RepositoriesComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "repository/:xref",
    component: RepositoryComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "sources",
    component: SourcesComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "source/:xref",
    component: SourceComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "places",
    component: PlacesComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "multimedias",
    component: MultimediasComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  {
    path: "multimedia/:xref",
    component: MultimediaComponent,
    resolve: { ancestryDatabase: ancestryDatabaseResolver },
    runGuardsAndResolvers: "always",
  },
  { path: "validation", component: ValidationComponent },
  { path: "**", component: PageNotFoundComponent },
];
