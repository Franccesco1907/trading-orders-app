import type { Routes } from '@angular/router';

export const tradesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./trade-list/trade-list.component').then((m) => m.TradeListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./trade-new/trade-new.component').then((m) => m.TradeNewComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./trade-detail/trade-detail.component').then((m) => m.TradeDetailComponent),
  },
];
