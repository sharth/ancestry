import { type Routes } from '@angular/router'
import { IndividualComponent } from './individual/individual.component'
import { IndividualsComponent } from './individuals/individuals.component'
import { SourcesComponent } from './sources/sources.component'
import { SourceComponent } from './source/source.component'

export const routes: Routes = [
  { path: '', redirectTo: '/individuals', pathMatch: 'full' },
  { path: 'individuals', component: IndividualsComponent },
  { path: 'individual/:xref', component: IndividualComponent },
  { path: 'sources', component: SourcesComponent },
  { path: 'source/:xref', component: SourceComponent }
]
