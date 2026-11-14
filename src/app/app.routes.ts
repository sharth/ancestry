import type { ActivatedRouteSnapshot, Routes } from "@angular/router";

import {
  ancestryDatabaseGuard,
  ancestryDatabaseResources,
} from "../database/ancestry.service";
import { FamiliesComponent } from "./families/families.component";
import { FamilyFactsComponent } from "./family/family-facts.component";
import { FamilyGedcomComponent } from "./family/family-gedcom.component";
import { FamilySourcesComponent } from "./family/family-sources.component";
import { FamilyComponent } from "./family/family.component";
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
import { PlaceComponent } from "./place/place.component";
import { PlacesComponent } from "./places/places.component";
import { RepositoriesComponent } from "./repositories/repositories.component";
import { RepositoryComponent } from "./repository/repository.component";
import { SearchComponent } from "./search/search.component";
import { SettingsComponent } from "./settings/settings.component";
import { SourceCitationsComponent } from "./source/source-citations.component";
import { SourceGedcomComponent } from "./source/source-gedcom.component";
import { SourceOverviewComponent } from "./source/source-overview.component";
import { SourceComponent } from "./source/source.component";
import { SourcesComponent } from "./sources/sources.component";
import { confirmUnsavedChangesGuard } from "./unsaved-changes.guard";
import { ValidationComponent } from "./validation/validation.component";

export const routes: Routes = [
  {
    path: "",
    component: IndexComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
  },
  {
    path: "settings",
    component: SettingsComponent,
  },
  {
    path: "search",
    component: SearchComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
  },
  {
    path: "individuals",
    component: IndividualsComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "individual/:xref",
    component: IndividualComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
    children: [
      { path: "", redirectTo: "facts", pathMatch: "full" },
      {
        path: "facts",
        component: IndividualFactsComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "ancestors",
        component: IndividualAncestorsComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "sources",
        component: IndividualSourcesComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "gedcom",
        component: IndividualGedcomComponent,
        resources: ancestryDatabaseResources,
      },
    ],
  },
  {
    path: "families",
    component: FamiliesComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "family/:xref",
    component: FamilyComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
    children: [
      { path: "", redirectTo: "facts", pathMatch: "full" },
      {
        path: "facts",
        component: FamilyFactsComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "sources",
        component: FamilySourcesComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "gedcom",
        component: FamilyGedcomComponent,
        resources: ancestryDatabaseResources,
      },
    ],
  },
  {
    path: "repositories",
    component: RepositoriesComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "repository/:xref",
    component: RepositoryComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "sources",
    component: SourcesComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "source/:xref",
    component: SourceComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
    children: [
      { path: "", redirectTo: "overview", pathMatch: "full" },
      {
        path: "overview",
        component: SourceOverviewComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "citations",
        component: SourceCitationsComponent,
        resources: ancestryDatabaseResources,
      },
      {
        path: "gedcom",
        component: SourceGedcomComponent,
        resources: ancestryDatabaseResources,
      },
    ],
  },
  {
    path: "places",
    component: PlacesComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
  },
  {
    // Matches any number of remaining segments under `place/`, so a region
    // at any depth of the place hierarchy (e.g. "united-states/maryland")
    // gets its own URL.
    path: "place",
    children: [
      {
        matcher: (segments) => ({ consumed: segments }),
        component: PlaceComponent,
        canActivate: [ancestryDatabaseGuard],
        resources: ancestryDatabaseResources,
        resolve: {
          // The matched `place/...` segments as plain, lowercased strings,
          // e.g. ["united-states", "maryland"].
          path: (route: ActivatedRouteSnapshot) =>
            route.url.map((segment) => segment.path.toLowerCase()),
        },
      },
    ],
  },
  {
    path: "multimedias",
    component: MultimediasComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "multimedia/:xref",
    component: MultimediaComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  {
    path: "validation",
    component: ValidationComponent,
    canActivate: [ancestryDatabaseGuard],
    resources: ancestryDatabaseResources,
    canDeactivate: [confirmUnsavedChangesGuard],
  },
  { path: "**", component: PageNotFoundComponent },
];
