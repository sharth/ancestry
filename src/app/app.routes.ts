import { type Routes } from '@angular/router'
import { IndexComponent } from './index/index.component'
import { IndividualComponent } from './individual/individual.component'
import { IndividualsComponent } from './individuals/individuals.component'
import { SourcesComponent } from './sources/sources.component'
import { SourceDetailComponent } from './source-detail/source-detail.component'
import { RepositoriesComponent } from './repositories/repositories.component'
import { RepositoryComponent } from './repository/repository.component'
import { SourceEditorComponent } from './source-editor/source-editor.component'

export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'individuals', component: IndividualsComponent },
  { path: 'individual/:xref', component: IndividualComponent },
  { path: 'repositories', component: RepositoriesComponent },
  { path: 'repository/:xref', component: RepositoryComponent },
  { path: 'sources', component: SourcesComponent },
  { path: 'source/:xref', component: SourceDetailComponent },
  { path: 'source/:xref/edit', component: SourceEditorComponent }
]
