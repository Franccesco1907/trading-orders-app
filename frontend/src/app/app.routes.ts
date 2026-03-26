import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'trades' },
  {
    path: 'trades',
    loadChildren: () =>
      import('./features/trades/trades.routes').then((m) => m.tradesRoutes),
  },
  { path: '**', redirectTo: 'trades' },
];
