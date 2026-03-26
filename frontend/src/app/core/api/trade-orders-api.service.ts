import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiEnvelope, ApiErrorBody } from '../models/api-envelope.model';
import type {
  CreateTradeOrderPayload,
  PaginatedTradeOrders,
  TradeOrder,
  UpdateTradeOrderPayload,
} from '../models/trade-order.model';

@Injectable({ providedIn: 'root' })
export class TradeOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBasePath;

  list(page = 1, limit = 20): Observable<PaginatedTradeOrders> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http
      .get<ApiEnvelope<PaginatedTradeOrders>>(`${this.baseUrl}/trade_orders`, { params })
      .pipe(map((env) => env.data), catchError((e) => this.mapError(e)));
  }

  getById(id: string): Observable<TradeOrder> {
    return this.http
      .get<ApiEnvelope<TradeOrder>>(`${this.baseUrl}/trade_orders/${id}`)
      .pipe(map((env) => env.data), catchError((e) => this.mapError(e)));
  }

  create(body: CreateTradeOrderPayload): Observable<TradeOrder> {
    return this.http
      .post<ApiEnvelope<TradeOrder>>(`${this.baseUrl}/trade_orders`, body)
      .pipe(map((env) => env.data), catchError((e) => this.mapError(e)));
  }

  update(id: string, body: UpdateTradeOrderPayload): Observable<TradeOrder> {
    return this.http
      .put<ApiEnvelope<TradeOrder>>(`${this.baseUrl}/trade_orders/${id}`, body)
      .pipe(map((env) => env.data), catchError((e) => this.mapError(e)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.baseUrl}/trade_orders/${id}`)
      .pipe(map(() => undefined), catchError((e) => this.mapError(e)));
  }

  private mapError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiErrorBody | undefined;
      const msg = formatApiErrorMessage(body?.errors?.error ?? error.message);
      return throwError(() => new Error(msg));
    }
    return throwError(() => new Error('Unknown network error'));
  }
}

function formatApiErrorMessage(error: unknown): string {
  if (error == null) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string') {
      return m;
    }
    if (Array.isArray(m)) {
      return m.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('; ');
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Validation error';
  }
}
