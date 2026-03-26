import { CurrencyPipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TradeOrdersApiService } from '../../../core/api/trade-orders-api.service';
import type { TradeOrderType, TradeSide } from '../../../core/models/trade-order.model';
import { SUPPORTED_PAIRS, MARKET_PRICES } from '../../../core/trade-order.constants';
import { finalize } from 'rxjs';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const PRICE_PATTERN = /^\d+(\.\d{1,5})?$/;

interface MarketTicker {
  pair: string;
  label: string;
  price: number;
  change: number;
  iconLetter: string;
  iconClass: string;
}

@Component({
  selector: 'app-trade-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    UpperCasePipe,
    ReactiveFormsModule,
    MatIcon,
  ],
  templateUrl: './trade-new.component.html',
  styleUrl: './trade-new.component.css',
})
export class TradeNewComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(TradeOrdersApiService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly supportedPairs = SUPPORTED_PAIRS;
  readonly sides: TradeSide[] = ['buy', 'sell'];
  readonly types: TradeOrderType[] = ['limit', 'market', 'stop'];

  readonly submitting = signal(false);

  readonly form = this.fb.group({
    side: this.fb.control<TradeSide>('buy', Validators.required),
    type: this.fb.control<TradeOrderType>('limit', Validators.required),
    amount: this.fb.control<string>('', [
      Validators.required,
      Validators.pattern(AMOUNT_PATTERN),
    ]),
    price: this.fb.control<string>('', [
      Validators.required,
      Validators.pattern(PRICE_PATTERN),
    ]),
    pair: this.fb.control<string>(SUPPORTED_PAIRS[0], Validators.required),
  });

  readonly marketTickers: MarketTicker[] = [
    { pair: 'BTCUSD', label: 'BITCOIN / US DOLLAR', price: 100150.4, change: 2.45, iconLetter: 'B', iconClass: 'ticker-icon--btc' },
    { pair: 'EURUSD', label: 'EURO / US DOLLAR', price: 1.035, change: -0.12, iconLetter: '€', iconClass: 'ticker-icon--eur' },
    { pair: 'ETHUSD', label: 'ETHEREUM / US DOLLAR', price: 3310.0, change: 1.08, iconLetter: 'Ξ', iconClass: 'ticker-icon--eth' },
  ];

  readonly estimatedFee = computed(() => {
    const amount = Number(this.form.controls.amount.value) || 0;
    const price = Number(this.form.controls.price.value) || 0;
    return amount * price * 0.001;
  });

  readonly totalCost = computed(() => {
    const amount = Number(this.form.controls.amount.value) || 0;
    const price = Number(this.form.controls.price.value) || 0;
    return amount * price + this.estimatedFee();
  });

  readonly priceValidationError = signal<string | null>(null);

  selectSide(side: TradeSide): void {
    this.form.controls.side.setValue(side);
    this.validatePrice();
  }

  getPairSuffix(): string {
    const pair = this.form.controls.pair.value;
    return pair.slice(0, 3);
  }

  getMarketPrice(): number {
    return MARKET_PRICES[this.form.controls.pair.value] ?? 0;
  }

  validatePrice(): string | null {
    const raw = this.form.getRawValue();
    const price = Number(raw.price);
    const marketPrice = MARKET_PRICES[raw.pair];

    if (!price || !marketPrice || raw.type === 'market') {
      this.priceValidationError.set(null);
      return null;
    }

    let error: string | null = null;

    if (raw.type === 'limit') {
      if (raw.side === 'buy' && price >= marketPrice) {
        error = `Buy limit must be < market price`;
      } else if (raw.side === 'sell' && price <= marketPrice) {
        error = `Sell limit must be > market price`;
      }
    } else if (raw.type === 'stop') {
      if (raw.side === 'buy' && price <= marketPrice) {
        error = `Buy stop must be > market price`;
      } else if (raw.side === 'sell' && price >= marketPrice) {
        error = `Sell stop must be < market price`;
      }
    }

    this.priceValidationError.set(error);
    return error;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const amount = Number(raw.amount);
    const price = Number(raw.price);
    if (!Number.isFinite(amount) || !Number.isFinite(price) || amount <= 0 || price <= 0) {
      this.snackBar.open('Amount and price must be positive numbers', 'Close', {
        duration: 5000,
      });
      return;
    }

    const priceError = this.validatePrice();
    if (priceError) {
      this.snackBar.open(priceError, 'Close', { duration: 5000 });
      return;
    }
    this.submitting.set(true);
    this.api
      .create({
        side: raw.side,
        type: raw.type,
        amount,
        price,
        pair: raw.pair,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Order created successfully', 'Close', { duration: 3500 });
          void this.router.navigate(['/trades']);
        },
        error: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error creating the order';
          this.snackBar.open(msg, 'Close', { duration: 8000 });
        },
      });
  }
}
