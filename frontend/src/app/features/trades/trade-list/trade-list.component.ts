import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TradeOrdersApiService } from '../../../core/api/trade-orders-api.service';
import type { TradeOrder } from '../../../core/models/trade-order.model';
import { BehaviorSubject, Subject, switchMap, catchError, map, of, startWith, merge, filter } from 'rxjs';

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: { items: TradeOrder[]; total: number; page: number; limit: number } };

@Component({
  selector: 'app-trade-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    UpperCasePipe,
    RouterLink,
    MatIcon,
    MatPaginator,
    MatProgressSpinner,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatTooltip,
  ],
  templateUrl: './trade-list.component.html',
  styleUrl: './trade-list.component.css',
})
export class TradeListComponent {
  private readonly api = inject(TradeOrdersApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['id', 'pair', 'side', 'type', 'amount', 'price', 'status', 'createdAt', 'actions'];
  readonly pageSizeOptions = [5, 10, 25];

  private readonly page$ = new BehaviorSubject<{ page: number; limit: number }>({ page: 1, limit: 10 });
  private readonly refresh$ = new Subject<void>();

  readonly state$ = merge(this.page$, this.refresh$.pipe(map(() => this.page$.value))).pipe(
    switchMap(({ page, limit }) =>
      this.api.list(page, limit).pipe(
        map(
          (p): ListState => ({
            status: 'success',
            data: { items: p.items, total: p.total, page: p.page, limit: p.limit },
          }),
        ),
        startWith({ status: 'loading' } satisfies ListState),
        catchError((err: unknown) =>
          of({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load orders',
          } satisfies ListState),
        ),
      ),
    ),
  );

  onPageChange(event: PageEvent): void {
    this.page$.next({ page: event.pageIndex + 1, limit: event.pageSize });
  }

  viewOrder(order: TradeOrder): void {
    void this.router.navigate(['/trades', order.id]);
  }

  editOrder(order: TradeOrder): void {
    void this.router.navigate(['/trades', order.id], { queryParams: { edit: true } });
  }

  deleteOrder(order: TradeOrder): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { orderId: `ORD-${this.truncateId(order.id)}` },
      panelClass: 'confirm-dialog-panel',
      width: '420px',
    });

    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => {
      this.api.delete(order.id).subscribe({
        next: () => {
          this.snackBar.open('Order deleted successfully', 'Close', { duration: 3500 });
          this.refresh$.next();
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error deleting order';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
    });
  }

  truncateId(id: string): string {
    if (id.length <= 10) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  }

  getPairIconClass(pair: string): string {
    const p = pair.toUpperCase();
    if (p.startsWith('BTC')) return 'pair-icon pair-icon--btc';
    if (p.startsWith('ETH')) return 'pair-icon pair-icon--eth';
    if (p.startsWith('EUR')) return 'pair-icon pair-icon--eur';
    return 'pair-icon pair-icon--default';
  }

  getPairIconLetter(pair: string): string {
    const p = pair.toUpperCase();
    if (p.startsWith('BTC')) return 'B';
    if (p.startsWith('ETH')) return 'Ξ';
    if (p.startsWith('EUR')) return '€';
    return pair[0];
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open': return 'status-cell status--open';
      case 'executed': return 'status-cell status--executed';
      case 'cancelled': return 'status-cell status--cancelled';
      default: return 'status-cell';
    }
  }

  getSideBadgeClass(side: string): string {
    return side.toLowerCase() === 'buy' ? 'side-badge side-badge--buy' : 'side-badge side-badge--sell';
  }

  computeOpenVolume(items: TradeOrder[]): number {
    return items
      .filter(i => i.status.toLowerCase() === 'open')
      .reduce((sum, i) => sum + Number(i.amount) * Number(i.price), 0);
  }

  getActivePairs(items: TradeOrder[]): string[] {
    return [...new Set(items.map(i => i.pair.toUpperCase()))];
  }
}
