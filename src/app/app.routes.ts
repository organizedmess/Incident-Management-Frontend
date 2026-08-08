import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard — Sentinel',
      },
      {
        path: 'incidents',
        loadComponent: () => import('./features/incidents/incidents').then((m) => m.Incidents),
        title: 'Incidents — Sentinel',
      },
      {
        path: 'incidents/:id',
        loadComponent: () => import('./features/incident-detail/incident-detail').then((m) => m.IncidentDetail),
        title: 'Incident detail — Sentinel',
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics),
        title: 'Analytics — Sentinel',
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
