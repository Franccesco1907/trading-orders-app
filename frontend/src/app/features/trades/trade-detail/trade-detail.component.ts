import { CurrencyPipe, DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, finalize } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TradeOrdersApiService } from '../../../core/api/trade-orders-api.service';
import type { TradeOrder, TradeOrderStatus, TradeOrderType, TradeSide } from '../../../core/models/trade-order.model';
import { SUPPORTED_PAIRS, MARKET_PRICES } from '../../../core/trade-order.constants';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_PATTERN = /^\d+(\.\d{1,5})?$/;

@Component({
  selector: 'app-trade-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    UpperCasePipe,
    RouterLink,
    ReactiveFormsModule,
    MatIcon,
    MatProgressSpinner,
  ],
  templateUrl: './trade-detail.component.html',
  styleUrl: './trade-detail.component.css',
})
export class TradeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TradeOrdersApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly supportedPairs = SUPPORTED_PAIRS;
  readonly sides: TradeSide[] = ['buy', 'sell'];
  readonly types: TradeOrderType[] = ['limit', 'market', 'stop'];
  readonly statuses: TradeOrderStatus[] = ['open', 'executed', 'cancelled'];

  readonly order = signal<TradeOrder | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    amount: this.fb.control<string>('', [Validators.required, Validators.pattern(AMOUNT_PATTERN)]),
    price: this.fb.control<string>('', [Validators.required, Validators.pattern(PRICE_PATTERN)]),
    status: this.fb.control<TradeOrderStatus>('open', Validators.required),
    side: this.fb.control<TradeSide>('buy', Validators.required),
    type: this.fb.control<TradeOrderType>('limit', Validators.required),
    pair: this.fb.control<string>(SUPPORTED_PAIRS[0], Validators.required),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const editMode = this.route.snapshot.queryParamMap.get('edit') === 'true';

    this.api.getById(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
        this.populateForm(order);
        if (editMode) this.editing.set(true);
      },
      error: (err: unknown) => {
        this.error.set(err instanceof Error ? err.message : 'Failed to load order');
        this.loading.set(false);
      },
    });
  }

  truncateId(id: string): string {
    if (id.length <= 12) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  }

  getMarketPrice(): number {
    const o = this.order();
    return o ? (MARKET_PRICES[o.pair] ?? 0) : 0;
  }

  getTotalCost(): number {
    const o = this.order();
    if (!o) return 0;
    return Number(o.amount) * Number(o.price);
  }

  getPairBase(): string {
    const o = this.order();
    if (!o) return '';
    return o.pair.slice(0, 3);
  }

  getPairQuote(): string {
    const o = this.order();
    if (!o) return '';
    return o.pair.slice(3);
  }

  getPairIconClass(): string {
    const o = this.order();
    if (!o) return 'pair-icon pair-icon--default';
    const p = o.pair.toUpperCase();
    if (p.startsWith('BTC')) return 'pair-icon pair-icon--btc';
    if (p.startsWith('ETH')) return 'pair-icon pair-icon--eth';
    if (p.startsWith('EUR')) return 'pair-icon pair-icon--eur';
    return 'pair-icon pair-icon--default';
  }

  getPairIconLetter(): string {
    const o = this.order();
    if (!o) return '?';
    const p = o.pair.toUpperCase();
    if (p.startsWith('BTC')) return 'B';
    if (p.startsWith('ETH')) return 'Ξ';
    if (p.startsWith('EUR')) return '€';
    return o.pair[0];
  }

  enableEdit(): void {
    const o = this.order();
    if (o) this.populateForm(o);
    this.editing.set(true);
  }

  cancelEdit(): void {
    const o = this.order();
    if (o) this.populateForm(o);
    this.editing.set(false);
  }

  saveOrder(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const o = this.order();
    if (!o) return;

    const raw = this.form.getRawValue();
    this.saving.set(true);

    this.api
      .update(o.id, {
        amount: Number(raw.amount),
        price: Number(raw.price),
        status: raw.status,
        side: raw.side,
        type: raw.type,
        pair: raw.pair,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.editing.set(false);
          this.snackBar.open('Order updated successfully', 'Close', { duration: 3500 });
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error updating order';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }

  deleteOrder(): void {
    const o = this.order();
    if (!o) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { orderId: `ORD-${this.truncateId(o.id)}` },
      panelClass: 'confirm-dialog-panel',
      width: '420px',
    });

    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => {
      this.api.delete(o.id).subscribe({
        next: () => {
          this.snackBar.open('Order deleted successfully', 'Close', { duration: 3500 });
          void this.router.navigate(['/trades']);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error deleting order';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
    });
  }

  private populateForm(order: TradeOrder): void {
    this.form.patchValue({
      amount: order.amount,
      price: order.price,
      status: order.status as TradeOrderStatus,
      side: order.side as TradeSide,
      type: order.type as TradeOrderType,
      pair: order.pair,
    });
  }
}
