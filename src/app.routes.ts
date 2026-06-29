import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { DataService } from './services/data.service';

const encyclopediaReady: ResolveFn<boolean> = async () => {
  await inject(DataService).ensureEncyclopediaLoaded();
  return true;
};

const readingsReady: ResolveFn<boolean> = async () => {
  await inject(DataService).ensureReadingsLoaded();
  return true;
};

const resourcesReady: ResolveFn<boolean> = async () => {
  await inject(DataService).ensureResourcesLoaded();
  return true;
};

const standardsReady: ResolveFn<boolean> = async () => {
  await inject(DataService).ensureStandardsLoaded();
  return true;
};

const competitionsReady: ResolveFn<boolean> = async () => {
  await inject(DataService).ensureCompetitionsLoaded();
  return true;
};

const userReady: ResolveFn<boolean> = async () => {
  const data = inject(DataService);
  await Promise.all([
    data.ensureEncyclopediaLoaded(),
    data.ensureReadingsLoaded(),
    data.ensureResourcesLoaded(),
    data.ensureStandardsLoaded()
  ]);
  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'encyclopedia', pathMatch: 'full' },
  {
    path: 'encyclopedia',
    resolve: { data: encyclopediaReady },
    loadComponent: () => import('./components/encyclopedia/encyclopedia.component')
      .then(module => module.EncyclopediaComponent)
  },
  {
    path: 'entry/:id',
    resolve: { data: encyclopediaReady },
    loadComponent: () => import('./components/encyclopedia/entry-detail.component')
      .then(module => module.EntryDetailComponent)
  },
  {
    path: 'ai',
    loadComponent: () => import('./components/ai-assistant/ai-assistant.component')
      .then(module => module.AiAssistantComponent)
  },
  {
    path: 'resources',
    resolve: { data: resourcesReady },
    loadComponent: () => import('./components/resources/resources.component')
      .then(module => module.ResourcesComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./components/services/resource-services.component')
      .then(module => module.ResourceServicesComponent)
  },
  {
    path: 'standards',
    resolve: { data: standardsReady },
    loadComponent: () => import('./components/standards/standards.component')
      .then(module => module.StandardsComponent)
  },
  {
    path: 'readings',
    resolve: { data: readingsReady },
    loadComponent: () => import('./components/readings/readings.component')
      .then(module => module.ReadingsComponent)
  },
  {
    path: 'competitions',
    resolve: { data: competitionsReady },
    loadComponent: () => import('./components/competitions/competitions.component')
      .then(module => module.CompetitionsComponent)
  },
  {
    path: 'essentials',
    loadComponent: () => import('./components/essentials/essentials.component')
      .then(module => module.EssentialsComponent)
  },
  {
    path: 'essentials/methodology',
    loadComponent: () => import('./components/essentials/methodology.component')
      .then(module => module.MethodologyComponent)
  },
  {
    path: 'essentials/qna',
    loadComponent: () => import('./components/essentials/qna.component')
      .then(module => module.QnaComponent)
  },
  {
    path: 'essentials/career',
    loadComponent: () => import('./components/essentials/career.component')
      .then(module => module.CareerComponent)
  },
  {
    path: 'user',
    resolve: { data: userReady },
    loadComponent: () => import('./components/user/user-dashboard.component')
      .then(module => module.UserDashboardComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/contact/contact.component')
      .then(module => module.ContactComponent)
  },
  { path: 'about', redirectTo: 'contact', pathMatch: 'full' }
];
