
import { Routes } from '@angular/router';
import { EncyclopediaComponent } from './components/encyclopedia/encyclopedia.component';
import { EntryDetailComponent } from './components/encyclopedia/entry-detail.component';
import { AiAssistantComponent } from './components/ai-assistant/ai-assistant.component';
import { ResourcesComponent } from './components/resources/resources.component';
import { UserDashboardComponent } from './components/user/user-dashboard.component';
import { ContactComponent } from './components/contact/contact.component';
import { ReadingsComponent } from './components/readings/readings.component';
import { CompetitionsComponent } from './components/competitions/competitions.component';
import { EssentialsComponent } from './components/essentials/essentials.component';
import { MethodologyComponent } from './components/essentials/methodology.component';
import { QnaComponent } from './components/essentials/qna.component';
import { CareerComponent } from './components/essentials/career.component';

export const routes: Routes = [
  { path: '', redirectTo: 'encyclopedia', pathMatch: 'full' },
  { path: 'encyclopedia', component: EncyclopediaComponent },
  { path: 'entry/:id', component: EntryDetailComponent },
  { path: 'ai', component: AiAssistantComponent },
  { path: 'resources', component: ResourcesComponent },
  { path: 'readings', component: ReadingsComponent },
  { path: 'competitions', component: CompetitionsComponent },
  { path: 'essentials', component: EssentialsComponent },
  { path: 'essentials/methodology', component: MethodologyComponent },
  { path: 'essentials/qna', component: QnaComponent },
  { path: 'essentials/career', component: CareerComponent },
  { path: 'user', component: UserDashboardComponent }, // Handles History & Favorites
  { path: 'contact', component: ContactComponent },
  { path: 'about', component: ContactComponent },
];
