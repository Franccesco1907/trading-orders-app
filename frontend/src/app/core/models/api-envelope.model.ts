export interface ApiEnvelope<T> {
  status: number;
  data: T;
  errors: unknown;
}

export interface ApiErrorBody {
  status: number;
  data: null;
  errors: {
    error: unknown;
    path: string;
  };
}
